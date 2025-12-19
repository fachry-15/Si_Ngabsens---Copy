import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { attendanceService } from '../services/attendanceService';
import { authStore } from '../store/authStore';

// Perhitungan rasio agar kamera tidak gepeng (Rasio standar sensor 4:3)
const { width: screenWidth } = Dimensions.get('window');
const cameraHeight = (screenWidth - 40) * (4 / 3); 

export default function CheckInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const statusType = params.status as string;
  const notesParam = params.notes as string | undefined;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [area, setArea] = useState<string>('');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [notes, setNotes] = useState('');

  // Set notes dari query param jika ada (untuk check out early)
  useEffect(() => {
    if (statusType === 'checkout' && notesParam && notes === '') {
      setNotes(notesParam);
    }
  }, [statusType, notesParam]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    initSetup();
    return () => clearInterval(timer);
  }, []);

  const initSetup = async () => {
    // 1. Izin Kamera
    if (!permission?.granted) {
      await requestPermission();
    }

    // 2. Izin & Cek Lokasi
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc);
        
        // 3. Validasi Area via API
        const token = authStore.getState().token;
        if (token) {
          const checkLocResult = await attendanceService.checkUserLocation(
            token,
            loc.coords.latitude,
            loc.coords.longitude
          );
          setArea(checkLocResult.area || "Area Terdeteksi");
        }
      } catch (e) {
        console.log("Location error:", e);
      }
    } else {
      Alert.alert("Izin Lokasi", "Aplikasi membutuhkan lokasi untuk validasi absen.");
    }
  };

  const takePicture = async () => {
    if (cameraRef) {
      setIsLoading(true);
      try {
        const res = await cameraRef.takePictureAsync({ 
          quality: 0.7,
          skipMetadata: true 
        });
        setPhoto(res.uri);
      } catch (error) {
        Alert.alert("Error", "Gagal mengambil foto");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const submitAttendance = async () => {
    if (!photo || !location) {
      Alert.alert("Peringatan", "Foto dan lokasi diperlukan.");
      return;
    }

    // Deteksi fake GPS
    if (location.mocked) {
      Alert.alert("Fake GPS terdeteksi!", "Silakan matikan aplikasi fake GPS sebelum absen.");
      return;
    }

    setIsLoading(true);
    try {
      const userId = authStore.getState().user?.id;
      const token = authStore.getState().token;

      if (!userId || !token) throw new Error("Sesi berakhir");

      const payload = {
        userId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        bukti: { 
          uri: photo, 
          type: 'image/jpeg', 
          name: 'attendance.jpg' 
        },
        token: token,
        notes: statusType === 'checkout' ? notes : undefined,
      };

      const result = statusType === 'checkin' 
        ? await attendanceService.checkIn(payload)
        : await attendanceService.checkOut(payload);

      if (result.success) {
        Alert.alert("Berhasil", "Data absensi Anda telah terkirim.", [
          { text: "Kembali", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan server");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal mengirim data. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={60} color="#6366f1" />
        <Text style={styles.permissionText}>Akses kamera diperlukan</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* NAVBAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
          <Ionicons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{statusType === 'checkin' ? 'Check In Presensi' : 'Check Out Presensi'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        
        {/* INFO AREA CARD */}
        <View style={styles.areaCard}>
          <View style={styles.areaIcon}>
            <Ionicons name="location" size={20} color="#6366f1" />
          </View>
          <View>
            <Text style={styles.areaLabel}>LOKASI SAAT INI</Text>
            <Text style={styles.areaName}>{area || "Memverifikasi Lokasi..."}</Text>
          </View>
        </View>

        {/* TIME DISPLAY */}
        <View style={styles.timeSection}>
          <Text style={styles.timeText}>
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.dateText}>{currentTime.toLocaleDateString('id-ID', { dateStyle: 'full' })}</Text>
        </View>

        {/* CAMERA SECTION (4:3 Ratio) */}
        <View style={[styles.cameraBox, { height: cameraHeight }]}>
          {!photo ? (
            <CameraView 
              ref={(ref) => setCameraRef(ref)} 
              style={StyleSheet.absoluteFill} 
              facing={facing}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.guideFrame} />
              </View>
              <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f ==='front'?'back':'front')}>
                <Ionicons name="camera-reverse" size={26} color="#FFF" />
              </TouchableOpacity>
            </CameraView>
          ) : (
            <View style={{ flex: 1 }}>
              <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.retakeText}>Ambil Ulang</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* NOTES (Checkout Only) */}
        {statusType === 'checkout' && (
          <View style={styles.noteSection}>
            <Text style={styles.labelCaps}>Laporan Kerja</Text>
            <TextInput 
              placeholder="Tuliskan ringkasan kerja hari ini..."
              multiline
              value={notes}
              onChangeText={setNotes}
              style={styles.inputNote}
            />
          </View>
        )}
      </ScrollView>

      {/* FOOTER BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={photo ? submitAttendance : takePicture}
          style={[styles.mainBtn, photo ? styles.btnSuccess : styles.btnPrimary, isLoading && styles.btnDisabled]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.mainBtnText}>
              {photo ? "KIRIM ABSENSI SEKARANG" : "AMBIL FOTO PRESENSI"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#1E293B' },
  
  scrollBody: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  
  areaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  areaIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  areaLabel: { fontSize: 10, color: '#64748B', fontWeight: '800' },
  areaName: { fontSize: 15, color: '#1E293B', fontWeight: '700' },

  timeSection: { alignItems: 'center', marginBottom: 25 },
  timeText: { fontSize: 52, fontWeight: '800', color: '#1E293B' },
  dateText: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },

  cameraBox: { width: '100%', borderRadius: 30, overflow: 'hidden', backgroundColor: '#000', elevation: 10 },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  guideFrame: { width: '75%', height: '70%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 100, borderStyle: 'dashed' },
  flipBtn: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 20 },
  
  retakeBtn: { position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  retakeText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 8 },

  noteSection: { marginTop: 20, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 25 },
  labelCaps: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase' },
  inputNote: { fontSize: 15, color: '#1E293B', minHeight: 60, textAlignVertical: 'top' },

  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  mainBtn: { height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  btnPrimary: { backgroundColor: '#1E293B' },
  btnSuccess: { backgroundColor: '#6366F1' },
  btnDisabled: { backgroundColor: '#94A3B8' },
  mainBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 },

  permissionText: { marginTop: 20, fontSize: 16, color: '#64748B', fontWeight: '600' },
  permissionBtn: { marginTop: 20, backgroundColor: '#6366F1', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20 },
  permissionBtnText: { color: '#FFF', fontWeight: '700' }
});