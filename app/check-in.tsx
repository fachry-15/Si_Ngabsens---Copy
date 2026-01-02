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
    View,
} from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
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
    useCameraPermission,
    useFrameProcessor
} from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import { useResizePlugin } from 'vision-camera-resize-plugin';

import CustomModal from '../components/CustomModal';
import { LocationSuccessModal } from '../components/LocationSuccessModal';
import { attendanceService } from '../services/attendanceService';
import { faceService } from '../services/faceVectorService';
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

export default function CheckInScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const statusType = params.status as string;

    const [userVector, setUserVector] = useState<number[] | null>(null);
    const [similarity, setSimilarity] = useState<number>(0);
    const [faceVerified, setFaceVerified] = useState(false);
    
    const tflite = useTensorflowModel(require('../assets/models/mobilefacenet.tflite'));
    const model = tflite.model;
    const { resize } = useResizePlugin();

    const [modal, setModal] = useState({ visible: false, type: 'info' as any, title: '', message: '', onClose: () => {} });
    const [locationModal, setLocationModal] = useState({ visible: false, areaName: '' });
    const [checkingLocation, setCheckingLocation] = useState(true);
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [step, setStep] = useState<'SHAKE' | 'FACE_CHECK' | 'READY'>('SHAKE');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [areaName, setAreaName] = useState('');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [lowPercentageCount, setLowPercentageCount] = useState(0);
    
    const camera = useRef<Camera>(null);
    const lastProcessedTime = useRef(0);
    const lastSimValue = useRef(0); 
    const isProcessingFace = useSharedValue(false);
    const shakeProgress = useSharedValue(0);
    const pulseAnimation = useSharedValue(1);

    useEffect(() => {
        // Animasi pulse untuk loading
        pulseAnimation.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            false
        );
    }, []);

    const device = useCameraDevice('front');
    const { hasPermission, requestPermission } = useCameraPermission();
    const { detectFaces } = useFaceDetector({ performanceMode: 'fast' });

    useEffect(() => {
        initSetup();
        (async () => {
            const res = await faceService.getUserFaceVector();
            if (res && res.data?.vector) {
                const vec = typeof res.data.vector === 'string' ? JSON.parse(res.data.vector) : res.data.vector;
                setUserVector(vec);
            }
        })();
    }, []);

    const initSetup = async () => {
        if (!hasPermission) await requestPermission();
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setCheckingLocation(false);
            setModal({ visible: true, type: 'error', title: 'Izin Ditolak', message: 'Akses GPS diperlukan.', onClose: () => router.back() });
            return;
        }

        try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc);
            const token = authStore.getState().token;
            if (token) {
                const res = await attendanceService.checkUserLocation(token, loc.coords.latitude, loc.coords.longitude);
                if (res.match === true) {
                    setAreaName(res.area || "Area Terverifikasi");
                    setCheckingLocation(false);
                    // Tampilkan modal lokasi sukses
                    setLocationModal({ visible: true, areaName: res.area || "Area Terverifikasi" });
                } else {
                    setCheckingLocation(false);
                    setModal({ visible: true, type: 'error', title: 'Lokasi Salah', message: res.message || 'Anda diluar radius.', onClose: () => router.back() });
                }
            }
        } catch (err) {
            setCheckingLocation(false);
            setModal({ visible: true, type: 'error', title: 'GPS Error', message: 'Gagal verifikasi lokasi.' });
        }
    };

    const onFaceMatched = Worklets.createRunOnJS((sim: number) => {
        if (sim <= 0) {
            lastSimValue.current = 0;
            setSimilarity(0);
            setFaceVerified(false);
        } else {
            if (lastSimValue.current === 0) {
                lastSimValue.current = sim;
            } else {
                lastSimValue.current = (lastSimValue.current * 0.05) + (sim * 0.95);
            }
            setSimilarity(lastSimValue.current);
            setFaceVerified(lastSimValue.current > 0.60);            
            // Track jika persentase stuck di rendah
            if (lastSimValue.current < 0.50 && step === 'READY') {
                setLowPercentageCount(prev => prev + 1);
            } else {
                setLowPercentageCount(0);
            }        }
        isProcessingFace.value = false;
    });

    const updateUIState = Worklets.createRunOnJS((detected: boolean, yaw: number) => {
        setIsFaceDetected(detected);
        if (!detected) {
            if (step !== 'SHAKE') {
                setStep('SHAKE');
                shakeProgress.value = 0;
            }
            return;
        }

        if (step === 'SHAKE') {
            const progress = Math.min(Math.abs(yaw) / 20, 1);
            if (progress > shakeProgress.value) shakeProgress.value = withTiming(progress);
            if (shakeProgress.value >= 0.8) setStep('FACE_CHECK');
        } else if (step === 'FACE_CHECK') {
            if (Math.abs(yaw) < 6) setStep('READY');
        }
    });

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        const now = Date.now();
        if (now - lastProcessedTime.current < 120) return;
        lastProcessedTime.current = now;

        const faces = detectFaces(frame);
        
        if (faces.length > 0) {
            const face = faces[0];
            updateUIState(true, face.yawAngle);

            if (model != null && userVector != null && !isProcessingFace.value) {
                isProcessingFace.value = true;
                const resized = resize(frame, { 
                    scale: { width: 112, height: 112 }, 
                    pixelFormat: 'rgb', 
                    dataType: 'float32' 
                });
                const output = model.runSync([resized]);
                if (output && output.length > 0) {
                    const currentVec = Array.from(output[0] as Float32Array);
                    let dot = 0, normA = 0, normB = 0;
                    for (let i = 0; i < currentVec.length; i++) {
                        dot += currentVec[i] * userVector[i];
                        normA += currentVec[i] * currentVec[i];
                        normB += userVector[i] * userVector[i];
                    }
                    const mag = Math.sqrt(normA) * Math.sqrt(normB);
                    const sim = mag !== 0 ? dot / mag : 0;
                    onFaceMatched(sim);
                } else {
                    isProcessingFace.value = false;
                }
            }
        } else {
            updateUIState(false, 0);
            onFaceMatched(0);
        }
    }, [model, userVector, step]);

    // Fungsi untuk mendapatkan kategori dan saran berdasarkan persentase
    const getSuggestion = (percentage: number) => {
        // Jika stuck di persentase rendah, sarankan reset
        if (lowPercentageCount > 50 && percentage < 50) {
            return {
                category: 'Perlu Reset',
                suggestion: 'Coba keluar dan scan ulang untuk hasil lebih baik',
                color: '#EF4444',
                showReset: true
            };
        }
        
        if (percentage < 30) {
            return {
                category: 'Sangat Rendah',
                suggestion: 'Pastikan pencahayaan cukup terang dan hadapkan wajah langsung ke kamera',
                color: '#EF4444',
                showReset: false
            };
        } else if (percentage < 50) {
            return {
                category: 'Rendah',
                suggestion: 'Dekatkan wajah ke kamera dan pastikan tidak ada bayangan di wajah',
                color: '#F59E0B',
                showReset: false
            };
        } else if (percentage < 65) {
            return {
                category: 'Sedang',
                suggestion: 'Lepas kacamata/masker jika ada, dan pastikan wajah terlihat jelas',
                color: '#3B82F6',
                showReset: false
            };
        } else if (percentage < 70) {
            return {
                category: 'Hampir Berhasil',
                suggestion: 'Tahan posisi, tetap diam sebentar...',
                color: '#10B981',
                showReset: false
            };
        } else {
            return {
                category: 'Terverifikasi',
                suggestion: 'Wajah berhasil dikenali!',
                color: '#10B981',
                showReset: false
            };
        }
    };

    // Fungsi untuk memberikan saran instruksi secara bergantian
    const getInstructionHint = () => {
        const percentage = Math.round(similarity * 100);
        
        if (!isFaceDetected) return "HADAPKAN WAJAH KE KAMERA";
        if (step === 'SHAKE') return "GELENGKAN KEPALA PERLAHAN";
        if (step === 'FACE_CHECK') return "POSISIKAN WAJAH DI TENGAH";
        
        if (faceVerified) return "VERIFIKASI BERHASIL";
        
        // Tampilkan kategori untuk debugging
        if (step === 'READY') {
            const { category } = getSuggestion(percentage);
            return `${category.toUpperCase()} (${percentage}%)`;
        }

        return `KECOCOKAN: ${percentage}%`;
    };

    const takePicture = async () => {
        if (!isFaceDetected || !faceVerified || step !== 'READY') return;
        try {
            const file = await camera.current?.takePhoto({ flash: 'off' });
            if (file) setPhoto(`file://${file.path}`);
        } catch (e) { console.error(e); }
    };

    const handleFinalSubmit = async () => {
        if (!photo || !location || !faceVerified) return;
        setIsLoading(true);
        try {
            const { user, token } = authStore.getState();
            // Ambil waktu sekarang (format HH:mm:ss)
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            const payload = {
                userId: user!.id,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                bukti: { uri: photo, type: 'image/jpeg', name: 'attendance.jpg' } as any,
                token: token!,
                notes: (params.notes as string) || "",
                ...(statusType === 'checkout' ? { time: currentTime } : {})
            };
            const result = statusType === 'checkin' ? await attendanceService.checkIn(payload) : await attendanceService.checkOut(payload);
            if (result.success) {
                setModal({ visible: true, type: 'success', title: 'Berhasil', message: 'Presensi telah tercatat.', onClose: () => router.replace('/(tabs)') });
            }
        } catch (e) {
            setModal({ visible: true, type: 'error', title: 'Gagal', message: 'Koneksi terganggu.' });
        } finally { setIsLoading(false); }
    };

    const animatedBorderStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${interpolate(shakeProgress.value, [0, 1], [0, 360])}deg` }],
        borderColor: !isFaceDetected ? COLORS.DANGER : (faceVerified ? COLORS.SUCCESS : COLORS.PRIMARY),
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseAnimation.value }],
    }));

    if (checkingLocation) {
        return (
            <View style={styles.loadingWrapper}>
                <View style={styles.loadingCard}>
                    <View style={styles.loadingIconContainer}>
                        <Animated.View style={[styles.loadingPulse, pulseStyle]} />
                        <View style={styles.loadingIconCircle}>
                            <Ionicons name="location" size={40} color={COLORS.PRIMARY} />
                        </View>
                    </View>
                    <Text style={styles.loadingTitle}>Memverifikasi Lokasi</Text>
                    <Text style={styles.loadingSubtitle}>Mohon tunggu, sedang memeriksa posisi Anda...</Text>
                    <View style={styles.loadingIndicatorWrapper}>
                        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
                    <Ionicons name="close" size={24} color={COLORS.TEXT} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verifikasi Wajah</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollBody} bounces={false}>
                <View style={styles.areaCard}>
                    <Ionicons name="business" size={20} color={COLORS.PRIMARY} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.areaLabel}>LOKASI TERDETEKSI</Text>
                        <Text style={styles.areaName}>{areaName || "Mencari Lokasi..."}</Text>
                    </View>
                </View>

                <View style={styles.cameraWrapper}>
                    <View style={styles.cameraOuterBorder}>
                        <Animated.View style={[styles.progressRing, animatedBorderStyle]} />
                        <View style={styles.cameraCircle}>
                            {!photo ? (
                                <Camera ref={camera} style={StyleSheet.absoluteFill} device={device!} isActive={true} frameProcessor={frameProcessor} pixelFormat="yuv" photo={true} />
                            ) : (
                                <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} />
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.statusBox}>
                    <View style={[styles.statusBadge, { 
                        backgroundColor: !isFaceDetected ? '#FEE2E2' : (faceVerified ? '#D1FAE5' : '#E0F2FE')
                    }]}>
                        <Text style={[styles.statusTitle, { 
                            color: !isFaceDetected ? COLORS.DANGER : (faceVerified ? COLORS.SUCCESS : '#0369A1') 
                        }]}>
                            {getInstructionHint().toUpperCase()}
                        </Text>
                    </View>
                    
                    {isFaceDetected && step === 'READY' && !faceVerified && (
                        <View style={styles.suggestionWrapper}>
                            <Text style={[styles.suggestionText, { 
                                color: getSuggestion(Math.round(similarity * 100)).color 
                            }]}>
                                💡 {getSuggestion(Math.round(similarity * 100)).suggestion}
                            </Text>
                            {getSuggestion(Math.round(similarity * 100)).showReset && (
                                <TouchableOpacity 
                                    style={styles.resetButton}
                                    onPress={() => router.back()}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                                    <Text style={styles.resetButtonText}>Scan Ulang</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {photo ? (
                    <View style={styles.btnRow}>
                        <TouchableOpacity onPress={() => setPhoto(null)} style={[styles.mainBtn, styles.btnOutline]}>
                            <Text style={[styles.mainBtnText, {color: COLORS.TEXT}]}>ULANGI</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleFinalSubmit} style={[styles.mainBtn, {flex: 2, backgroundColor: COLORS.PRIMARY}]}>
                            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.mainBtnText}>KIRIM ABSEN</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={takePicture}
                        style={[styles.mainBtn, (isFaceDetected && faceVerified && step === 'READY') ? styles.btnSuccess : styles.btnDisabled]}
                        disabled={!faceVerified || !isFaceDetected || step !== 'READY'}
                    >
                        <Text style={styles.mainBtnText}>
                            {faceVerified ? "AMBIL FOTO" : "IKUTI INSTRUKSI"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <LocationSuccessModal
                visible={locationModal.visible}
                areaName={locationModal.areaName}
                onClose={() => setLocationModal({ visible: false, areaName: '' })}
            />

            <CustomModal visible={modal.visible} type={modal.type} title={modal.title} message={modal.message} onClose={() => { setModal(m => ({ ...m, visible: false })); modal.onClose(); }} />
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: COLORS.LIGHT_BG },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT },
    scrollBody: { paddingBottom: 150 },
    areaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 20, padding: 15, borderRadius: 15, elevation: 1 },
    areaLabel: { fontSize: 10, color: COLORS.SUBTEXT, fontWeight: 'bold' },
    areaName: { fontSize: 14, color: COLORS.TEXT, fontWeight: 'bold' },
    cameraWrapper: { alignItems: 'center', marginTop: 10 },
    cameraOuterBorder: { width: cameraSize + 22, height: cameraSize + 22, justifyContent: 'center', alignItems: 'center' },
    progressRing: { position: 'absolute', width: cameraSize + 14, height: cameraSize + 14, borderRadius: (cameraSize + 14) / 2, borderWidth: 5 },
    cameraCircle: { width: cameraSize, height: cameraSize, borderRadius: cameraSize / 2, overflow: 'hidden', backgroundColor: '#000', borderWidth: 4, borderColor: COLORS.WHITE },
    statusBox: { alignItems: 'center', marginTop: 25, paddingHorizontal: 30 },
    statusBadge: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 100, marginBottom: 8 },
    statusTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
    suggestionWrapper: {
        alignItems: 'center',
        marginTop: 8,
    },
    suggestionText: {
        fontSize: 13,
        fontFamily: 'Fredoka-Medium',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    resetButtonText: {
        fontSize: 13,
        fontFamily: 'Fredoka-Bold',
        color: '#FFFFFF',
    },
    hintText: { fontSize: 13, color: COLORS.SUBTEXT, textAlign: 'center', marginTop: 5, fontStyle: 'italic' },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 25, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20 },
    btnRow: { flexDirection: 'row', gap: 12 },
    mainBtn: { height: 55, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    btnOutline: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1' },
    btnSuccess: { backgroundColor: COLORS.PRIMARY, width: '100%' },
    btnDisabled: { backgroundColor: '#CBD5E1', width: '100%' },
    mainBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    loadingWrapper: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: COLORS.LIGHT_BG,
        paddingHorizontal: 30,
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    loadingIconContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    loadingIconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#E8F5F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#B8E6D5',
    },
    loadingPulse: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.PRIMARY,
        opacity: 0.2,
    },
    loadingTitle: {
        fontSize: 22,
        fontFamily: 'Fredoka-Bold',
        color: COLORS.TEXT,
        marginBottom: 8,
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontSize: 14,
        fontFamily: 'Fredoka-Regular',
        color: COLORS.SUBTEXT,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    loadingIndicatorWrapper: {
        marginTop: 8,
    },
});