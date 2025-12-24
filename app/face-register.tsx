import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import CustomModal from '../components/CustomModal';
import { registerFaceVector } from '../services/faceVectorService';

const { width: screenWidth } = Dimensions.get('window');
const cameraSize = screenWidth * 0.75;

const COLORS = {
  PRIMARY: '#2D8A61',
  SUCCESS: '#10B981',
  DANGER: '#EF4444',
  WHITE: '#FFFFFF',
  TEXT: '#1E293B',
  SUBTEXT: '#94A3B8',
  LIGHT_BG: '#F8FAFC',
};

export default function FaceRegisterScreen() {
  const router = useRouter();
  
  const [faceVector, setFaceVector] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: 'success' as any, title: '', message: '' });
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [enrollStep, setEnrollStep] = useState<'CENTERING' | 'LIVENESS' | 'READY'>('CENTERING');
  
  const camera = useRef<Camera>(null);
  const lastProcessedTime = useRef(0);
  const enrollProgress = useSharedValue(0);

  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();
  
  // Pastikan path model benar
  const tflite = useTensorflowModel(require('../assets/models/mobile_face_net.tflite'));
  const model = tflite.model;
  
  const { detectFaces } = useFaceDetector({ 
    performanceMode: 'fast',
    classificationMode: 'none' // 'none' lebih cepat untuk deteksi yaw/posisi
  });

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // --- WORKLETS ---
  const onEnrollmentComplete = Worklets.createRunOnJS((vector: number[]) => {
    setFaceVector(vector);
    setEnrollStep('READY');
  });

  const updateUIStatus = Worklets.createRunOnJS((detected: boolean, yaw: number) => {
    setIsFaceDetected(detected);
    
    if (!detected) {
      if (enrollStep !== 'READY') {
        setEnrollStep('CENTERING');
        enrollProgress.value = withTiming(0);
      }
      return;
    }

    if (enrollStep === 'CENTERING') {
      // Jika wajah cukup lurus, pindah ke tahap liveness
      if (Math.abs(yaw) < 15) {
        setEnrollStep('LIVENESS');
      }
    } else if (enrollStep === 'LIVENESS') {
      // Menghitung progres berdasarkan sudut geleng kepala (yaw)
      // Dibuat lebih sensitif agar progres mudah naik
      const move = Math.min(Math.abs(yaw) / 18, 1);
      if (move > enrollProgress.value) {
        enrollProgress.value = withTiming(move, { duration: 150 });
      }
      // Jika progres sudah cukup, aktifkan tahap READY
      if (enrollProgress.value >= 0.85) {
        setEnrollStep('READY');
      }
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = Date.now();
    if (now - lastProcessedTime.current < 200) return;
    lastProcessedTime.current = now;

    const faces = detectFaces(frame);
    if (faces.length > 0) {
      const face = faces[0];
      updateUIStatus(true, face.yawAngle);

      // Ambil vektor jika progres liveness sudah hampir penuh (85%) dan faceVector belum ada
      if (enrollProgress.value >= 0.85 && model != null && !faceVector) {
        const resized = resize(frame, {
          scale: { width: 112, height: 112 },
          pixelFormat: 'rgb',
          dataType: 'float32',
        });
        const output = model.runSync([resized]);
        if (output && output.length > 0) {
          onEnrollmentComplete(Array.from(output[0] as Float32Array));
        }
      }
    } else {
      updateUIStatus(false, 0);
    }
  }, [model, enrollStep]);

  const onSave = async () => {
    if (!faceVector) return;
    setLoading(true);
    try {
      const result = await registerFaceVector(faceVector);
      if (result.success) {
        setModal({ visible: true, type: 'success', title: 'Berhasil!', message: 'Wajah kamu sudah terdaftar. Sekarang kamu bisa absen pakai wajah!' });
      } else {
        setModal({ visible: true, type: 'error', title: 'Gagal', message: result.message || 'Data tidak tersimpan, coba lagi ya.' });
      }
    } catch (err) {
      setModal({ visible: true, type: 'error', title: 'Error', message: 'Ada gangguan koneksi ke server.' });
    } finally {
      setLoading(false);
    }
  };

  // --- ANIMASI ---
  const progressStyle = useAnimatedStyle(() => {
    const color = interpolateColor(enrollProgress.value, [0, 1], [COLORS.PRIMARY, COLORS.SUCCESS]);
    return {
      borderColor: enrollStep === 'READY' ? COLORS.SUCCESS : color,
      borderTopColor: enrollStep === 'READY' ? COLORS.SUCCESS : color,
      borderRightColor: enrollProgress.value > 0.25 || enrollStep === 'READY' ? color : 'transparent',
      borderBottomColor: enrollProgress.value > 0.5 || enrollStep === 'READY' ? color : 'transparent',
      borderLeftColor: enrollProgress.value > 0.75 || enrollStep === 'READY' ? color : 'transparent',
      transform: [{ rotate: `${interpolate(enrollProgress.value, [0, 1], [0, 360])}deg` }]
    };
  });

  if (!hasPermission || !device) return <ActivityIndicator style={{flex:1}} color={COLORS.PRIMARY}/>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daftar Biometrik</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.textWrapper}>
          <Text style={styles.mainTitle}>Halo! Yuk, Scan Wajahmu</Text>
          <Text style={styles.subTitle}>Ikuti instruksi agar proses pendaftaran lancar.</Text>
        </View>

        <View style={styles.cameraContainer}>
          <View style={styles.outerCircle}>
            <Animated.View style={[styles.progressRing, progressStyle]} />
            <View style={styles.cameraCircle}>
              <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
              />
              {enrollStep === 'READY' && (
                <View style={styles.successOverlay}>
                  <Ionicons name="checkmark-circle" size={80} color={COLORS.SUCCESS} />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.guideBox}>
          <View style={[styles.statusBadge, { backgroundColor: isFaceDetected ? '#DCFCE7' : '#FEE2E2' }]}>
            <Text style={[styles.statusText, { color: isFaceDetected ? COLORS.SUCCESS : COLORS.DANGER }]}>
              {isFaceDetected ? 'WAJAH TERDETEKSI' : 'WAJAH BELUM TERLIHAT'}
            </Text>
          </View>
          
          <Text style={styles.instruction}>
            {!isFaceDetected ? "Posisikan wajahmu di tengah" :
             enrollStep === 'CENTERING' ? "Tatap lurus ke depan" :
             enrollStep === 'LIVENESS' ? "Gelengkan kepalamu ke kiri dan kanan" :
             "Wajah berhasil dipindai!"}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryBtn, enrollStep !== 'READY' && styles.btnDisabled]} 
          onPress={onSave} 
          disabled={loading || enrollStep !== 'READY'}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Simpan Wajah Saya</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
          if (modal.type === 'success') router.replace('/(tabs)');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.LIGHT_BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  headerTitle: { fontSize: 18, fontFamily: 'Fredoka-SemiBold', color: COLORS.TEXT },
  content: { paddingHorizontal: 25, alignItems: 'center', paddingBottom: 120 },
  textWrapper: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  mainTitle: { fontSize: 24, fontFamily: 'Fredoka-SemiBold', color: COLORS.TEXT, textAlign: 'center' },
  subTitle: { fontSize: 14, fontFamily: 'Fredoka', color: COLORS.SUBTEXT, textAlign: 'center', marginTop: 8 },
  cameraContainer: { width: cameraSize + 40, height: cameraSize + 40, justifyContent: 'center', alignItems: 'center' },
  outerCircle: { width: cameraSize + 20, height: cameraSize + 20, justifyContent: 'center', alignItems: 'center' },
  progressRing: { position: 'absolute', width: cameraSize + 10, height: cameraSize + 10, borderRadius: (cameraSize + 10) / 2, borderWidth: 6 },
  cameraCircle: { width: cameraSize, height: cameraSize, borderRadius: cameraSize / 2, overflow: 'hidden', backgroundColor: '#000', borderWidth: 4, borderColor: '#FFF' },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  guideBox: { marginTop: 30, alignItems: 'center', width: '100%' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  statusText: { fontSize: 11, fontFamily: 'Fredoka-SemiBold' },
  instruction: { fontSize: 18, fontFamily: 'Fredoka-SemiBold', color: COLORS.TEXT, textAlign: 'center', paddingHorizontal: 20 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 25, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20 },
  primaryBtn: { backgroundColor: COLORS.PRIMARY, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { backgroundColor: '#CBD5E1' },
  primaryBtnText: { color: '#FFF', fontFamily: 'Fredoka-SemiBold', fontSize: 16 },
});