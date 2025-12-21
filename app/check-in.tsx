import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
    withRepeat,
    withSequence,
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

import CustomModal from '../components/CustomModal';
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
    SUBTEXT: '#94A3B8',
    LIGHT_BG: '#F8FAFC'
};

// Fungsi point-in-polygon (Ray-casting algorithm)
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    let [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let [xi, yi] = polygon[i];
        let [xj, yj] = polygon[j];
        let intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-10) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Komponen Loading Lokasi yang Modern
 */
function LocationLoadingView() {
    const pulseValue = useSharedValue(1);
    const progressValue = useSharedValue(0);

    useEffect(() => {
        pulseValue.value = withRepeat(
            withSequence(withTiming(1.2, { duration: 800 }), withTiming(1, { duration: 800 })),
            -1,
            true
        );
        progressValue.value = withRepeat(
            withTiming(1, { duration: 2000 }),
            -1,
            false
        );
    }, []);

    const animatedPulse = useAnimatedStyle(() => ({
        transform: [{ scale: pulseValue.value }],
        opacity: interpolate(pulseValue.value, [1, 1.2], [1, 0.5])
    }));

    const animatedProgress = useAnimatedStyle(() => ({
        width: `${progressValue.value * 100}%`
    }));

    return (
        <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
                <View style={styles.iconContainer}>
                    <Animated.View style={[styles.pulseCircle, animatedPulse]} />
                    <View style={styles.mainCircle}>
                        <Ionicons name="location" size={32} color={COLORS.PRIMARY} />
                    </View>
                </View>
                
                <Text style={styles.loadingTitle}>Memverifikasi Lokasi</Text>
                <Text style={styles.loadingSubtitle}>
                    Mohon tunggu sebentar, kami sedang memastikan posisi Anda akurat.
                </Text>

                <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, animatedProgress]} />
                </View>

                <View style={styles.loadingFooter}>
                    <ActivityIndicator size="small" color={COLORS.SUBTEXT} />
                    <Text style={styles.loadingFooterText}>Mencari Sinyal GPS...</Text>
                </View>
            </View>
        </View>
    );
}

export default function CheckInScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const statusType = params.status as string;

    const [modal, setModal] = useState<{ visible: boolean, type?: 'success' | 'error' | 'info', title: string, message: string, onClose?: () => void }>({
        visible: false,
        type: 'info',
        title: '',
        message: ''
    });
    const [checkingLocation, setCheckingLocation] = useState(true);

    const showModal = (type: 'success' | 'error' | 'info', title: string, message: string, onClose?: () => void) => {
        setModal({ visible: true, type, title, message, onClose });
    };

    const hideModal = () => {
        setModal(m => ({ ...m, visible: false }));
        if (modal.onClose) modal.onClose();
    };

    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();
    const camera = useRef<Camera>(null);

    const format = useCameraFormat(device, [
        { fps: 30 },
        { videoResolution: { width: 1280, height: 720 } },
        { pixelFormat: 'yuv' }
    ]);

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

    const [step, setStep] = useState<'SHAKE' | 'FACE_CHECK' | 'READY'>('SHAKE');
    const [locationAllowed, setLocationAllowed] = useState(true);
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const shakeProgress = useSharedValue(0);

    const updateLivenessLogic = Worklets.createRunOnJS((detected: boolean, yaw: number) => {
        setIsFaceDetected(detected);
        if (!detected) {
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
            if (shakeProgress.value >= 0.95) setStep('FACE_CHECK');
        }

        if (step === 'FACE_CHECK') {
            if (Math.abs(yaw) < 8) setStep('READY');
        }
    });

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        const now = Date.now();
        if (now - lastProcessedTime.current < 200) return;
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
            try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLocation(loc);
                const token = authStore.getState().token;
                if (token) {
                    const res = await attendanceService.checkUserLocation(token, loc.coords.latitude, loc.coords.longitude);
                    setArea(res.area || "Area Terdeteksi");
                    if (res.match !== true) {
                        setLocationAllowed(false);
                        setCheckingLocation(false);
                        showModal('error', 'Lokasi Tidak Sesuai', res.message || 'Lokasi kamu belum sesuai.', () => router.replace('/(tabs)'));
                    } else {
                        setLocationAllowed(true);
                        setCheckingLocation(false);
                    }
                } else {
                    setCheckingLocation(false);
                }
            } catch (err) {
                setCheckingLocation(false);
                showModal('error', 'GPS Error', 'Gagal mendapatkan lokasi. Pastikan GPS aktif.');
            }
        } else {
            setCheckingLocation(false);
            showModal('error', 'Izin Ditolak', 'Aplikasi butuh izin lokasi.');
        }
    };

    const takePicture = async () => {
        if (!locationAllowed || step !== 'READY' || !isFaceDetected) return;
        if (camera.current) {
            setIsLoading(true);
            try {
                const file = await camera.current.takePhoto({
                    flash: 'off',
                    enableShutterSound: true
                });
                setPhoto(`file://${file.path}`);
            } catch (e) {
                showModal('error', 'Gagal', 'Terjadi kesalahan saat mengambil foto');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const submitAttendance = async () => {
        if (!locationAllowed || !photo || !location) return;
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
                showModal('success', 'Berhasil', 'Presensi Anda telah berhasil dikirim', () => router.back());
            } else {
                showModal('error', 'Gagal', result.message || 'Terjadi kesalahan saat absensi');
            }
        } catch (e) {
            showModal('error', 'Error', 'Mohon maaf, gagal mengirim data presensi');
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

    if (checkingLocation) {
        return <LocationLoadingView />;
    }

    return (
        <View style={{ flex: 1 }}>
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
                            <TouchableOpacity style={styles.retakeBtn} onPress={() => { setPhoto(null); setStep('SHAKE'); shakeProgress.value = 0; }}>
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

            <CustomModal
                visible={modal.visible}
                type={modal.type}
                title={modal.title}
                message={modal.message}
                onClose={hideModal}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#FFF' },
    // Styles Loading Lokasi
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 20 },
    loadingCard: { width: '100%', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 24, padding: 30 },
    iconContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    mainCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F1FDF7', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    pulseCircle: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.PRIMARY, zIndex: 1 },
    loadingTitle: { fontSize: 20, fontWeight: '800', color: COLORS.TEXT, marginBottom: 12 },
    loadingSubtitle: { fontSize: 14, color: COLORS.SUBTEXT, textAlign: 'center', lineHeight: 20, marginBottom: 30, paddingHorizontal: 20 },
    progressBarBg: { width: '80%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
    progressBarFill: { height: '100%', backgroundColor: COLORS.PRIMARY, borderRadius: 3 },
    loadingFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    loadingFooterText: { fontSize: 12, fontWeight: '600', color: COLORS.SUBTEXT },
    
    // Header & Body
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