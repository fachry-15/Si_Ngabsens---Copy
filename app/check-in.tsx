import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor
} from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

import { attendanceService } from '../services/attendanceService';
import { authStore } from '../store/authStore';

const { width: screenWidth } = Dimensions.get('window');
const cameraSize = screenWidth * 0.85;

const COLORS = {
  PRIMARY: '#2D8A61',
  SUCCESS: '#10B981',
  DANGER: '#EF4444',
  WHITE: '#FFFFFF',
  TEXT: '#1E293B',
  SUBTEXT: '#94A3B8'
};

export default function CheckInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const statusType = params.status as string;

  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  
  // Optimasi FPS & Resolusi (Agar tidak berat)
  const format = useCameraFormat(device, [
    { fps: 30 },
    { videoResolution: { width: 1280, height: 720 } },
    { pixelFormat: 'yuv' }
  ]);

  // Ref untuk Throttling (Deteksi 5x per detik saja)
  const lastProcessedTime = useRef(0);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    classificationMode: 'none', 
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [area, setArea] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // LOGIC STATES
  const [step, setStep] = useState<'SHAKE' | 'FACE_CHECK' | 'READY'>('SHAKE');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const shakeProgress = useSharedValue(0);

  const updateLivenessLogic = Worklets.createRunOnJS((detected: boolean, yaw: number) => {
    setIsFaceDetected(detected);

    if (!detected) {
      // Jika wajah hilang, reset progress kecuali sudah READY
      if (step !== 'READY') {
        setStep('SHAKE');
        shakeProgress.value = withTiming(0);
      }
      return;
    }

    if (step === 'SHAKE') {
      const currentShake = Math.min(Math.abs(yaw) / 20, 1);
      if (currentShake > shakeProgress.value) {
        shakeProgress.value = withTiming(currentShake, { duration: 150 });
      }
      if (shakeProgress.value >= 0.95) {
        setStep('FACE_CHECK');
      }
    }
    
    if (step === 'FACE_CHECK') {
      // Wajah harus tegak (yaw < 8 derajat)
      if (Math.abs(yaw) < 8) {
        setStep('READY');
      }
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    const now = Date.now();
    if (now - lastProcessedTime.current < 200) return; // Throttling 200ms
    lastProcessedTime.current = now;

    const faces = detectFaces(frame);
    if (faces.length > 0) {
      updateLivenessLogic(true, faces[0].yawAngle);
    } else {
      updateLivenessLogic(false, 0);
    }
  }, [detectFaces, step]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    initSetup();
    return () => clearInterval(timer);
  }, []);

  const initSetup = async () => {
    if (!hasPermission) await requestPermission();
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      const token = authStore.getState().token;
      if (token) {
        const res = await attendanceService.checkUserLocation(token, loc.coords.latitude, loc.coords.longitude);
        setArea(res.area || "Area Terdeteksi");
      }
    }
  };

  const takePicture = async () => {
    if (step !== 'READY' || !isFaceDetected) return;
    if (camera.current) {
      setIsLoading(true);
      try {
        const file = await camera.current.takePhoto({ 
          flash: 'off',
          enableShutterSound: true
        });
        setPhoto(`file://${file.path}`);
      } catch (e) {
        Alert.alert("Error", "Gagal mengambil foto");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const submitAttendance = async () => {
    if (!photo || !location) return;
    setIsLoading(true);
    try {
      const { user, token } = authStore.getState();
      const payload = {
        userId: user?.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        bukti: { uri: photo, type: 'image/jpeg', name: 'attendance.jpg' },
        token: token!,
        notes: statusType === 'checkout' ? params.notes : undefined,
      };
      const result = statusType === 'checkin' 
        ? await attendanceService.checkIn(payload)
        : await attendanceService.checkOut(payload);

      if (result.success) {
        Alert.alert("Berhasil", "Absensi terkirim", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (e) {
      Alert.alert("Error", "Gagal mengirim data.");
    } finally {
      setIsLoading(false);
    }
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const rotate = interpolate(shakeProgress.value, [0, 1], [0, 360]);
    const isCompleted = step === 'READY' || step === 'FACE_CHECK';
    const activeColor = step === 'READY' ? COLORS.SUCCESS : COLORS.PRIMARY;

    return {
      transform: [{ rotate: `${rotate}deg` }],
      borderColor: activeColor,
      borderTopColor: activeColor,
      borderRightColor: isCompleted ? activeColor : 'transparent',
      borderBottomColor: isCompleted ? activeColor : 'transparent',
      borderLeftColor: isCompleted ? activeColor : 'transparent',
    };
  });

  if (!hasPermission) return null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="close" size={24} color={COLORS.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{statusType === 'checkin' ? 'Check In Presensi' : 'Check Out Presensi'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.areaCard}>
          <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.areaLabel}>LOKASI ANDA</Text>
            <Text style={styles.areaName}>{area || "Mencari Lokasi..."}</Text>
          </View>
        </View>

        <View style={styles.timeSection}>
          <Text style={styles.timeText}>
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.dateText}>{currentTime.toLocaleDateString('id-ID', { dateStyle: 'full' })}</Text>
        </View>

        <View style={styles.cameraWrapper}>
          <View style={styles.cameraOuterBorder}>
            <Animated.View style={[styles.progressRing, animatedBorderStyle]} />
            <View style={styles.cameraCircle}>
              {!photo ? (
                device && (
                  <>
                    <Camera
                      ref={camera}
                      style={StyleSheet.absoluteFill}
                      device={device}
                      format={format}
                      fps={30}
                      isActive={true}
                      photo={true}
                      frameProcessor={frameProcessor}
                      pixelFormat="yuv"
                    />
                    <View style={styles.instructionOverlay}>
                      <Text style={styles.instructionText}>
                        {!isFaceDetected ? "WAJAH TIDAK TERDETEKSI" : 
                         step === 'SHAKE' ? "GELENGKAN KEPALA" : 
                         step === 'FACE_CHECK' ? "HADAP DEPAN" : "SIAP!"}
                      </Text>
                    </View>
                  </>
                )
              ) : (
                <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              )}
            </View>
          </View>

          {photo && (
            <TouchableOpacity style={styles.retakeBtn} onPress={() => {setPhoto(null); setStep('SHAKE'); shakeProgress.value = 0;}}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retakeText}>Ambil Ulang</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusBox}>
           <Text style={[styles.statusTitle, { color: isFaceDetected && step === 'READY' ? COLORS.SUCCESS : COLORS.PRIMARY }]}>
             {!isFaceDetected ? "DEKATKAN WAJAH KE KAMERA" : step === 'READY' ? "VERIFIKASI BERHASIL" : "VALIDASI ANTI-SPOOFING"}
           </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={photo ? submitAttendance : takePicture}
          style={[
            styles.mainBtn, 
            photo ? styles.btnSuccess : (step === 'READY' && isFaceDetected ? styles.btnPrimary : styles.btnDisabled),
            isLoading && styles.btnDisabled
          ]}
          disabled={isLoading || (!photo && (step !== 'READY' || !isFaceDetected))}
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : (
            <Text style={styles.mainBtnText}>
              {photo ? "KIRIM DATA ABSENSI" : "AMBIL FOTO PRESENSI"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.TEXT },
  scrollBody: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  areaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  areaLabel: { fontSize: 10, color: COLORS.SUBTEXT, fontWeight: '800' },
  areaName: { fontSize: 14, color: COLORS.TEXT, fontWeight: '700' },
  timeSection: { alignItems: 'center', marginBottom: 20 },
  timeText: { fontSize: 48, fontWeight: '800', color: COLORS.TEXT },
  dateText: { fontSize: 14, color: COLORS.SUBTEXT, fontWeight: '500' },
  cameraWrapper: { width: '100%', alignItems: 'center', marginVertical: 10 },
  cameraOuterBorder: { width: cameraSize + 22, height: cameraSize + 22, justifyContent: 'center', alignItems: 'center' },
  progressRing: { position: 'absolute', width: cameraSize + 14, height: cameraSize + 14, borderRadius: (cameraSize + 14) / 2, borderWidth: 6 },
  cameraCircle: { width: cameraSize, height: cameraSize, borderRadius: cameraSize / 2, overflow: 'hidden', backgroundColor: '#000', borderWidth: 4, borderColor: COLORS.WHITE },
  instructionOverlay: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  instructionText: { color: '#FFF', fontSize: 10, fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBox: { alignItems: 'center', marginTop: 15 },
  statusTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  retakeBtn: { position: 'absolute', bottom: -10, alignSelf: 'center', backgroundColor: COLORS.DANGER, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  retakeText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 8 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  mainBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#1E293B' },
  btnSuccess: { backgroundColor: COLORS.PRIMARY },
  btnDisabled: { backgroundColor: '#CBD5E1' },
  mainBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});