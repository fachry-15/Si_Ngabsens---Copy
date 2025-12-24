import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { 
    Image, 
    RefreshControl, 
    ScrollView, 
    StyleSheet, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    View, 
    Dimensions,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceRecord, attendanceService } from '../../services/attendanceService';
import { getUserFaceVector } from '../../services/faceVectorService';
import { masterControlService } from '../../services/masterControlService';
import { authStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

// Konfigurasi Font & Warna
const FONT = {
    REGULAR: 'Fredoka-Regular',
    MEDIUM: 'Fredoka-Medium',
    SEMIBOLD: 'Fredoka-SemiBold',
    BOLD: 'Fredoka-Bold',
};

const COLORS = {
    PRIMARY: '#2b5597',
    PRIMARY_LIGHT: '#EEF2FF',
    ACCENT: '#6366F1',
    TEXT_MAIN: '#111827',
    TEXT_SUB: '#6B7280',
    SUCCESS: '#10B981',
    SUCCESS_LIGHT: '#D1FAE5',
    WARNING: '#F59E0B',
    WARNING_LIGHT: '#FEF3C7',
    BG: '#F9FAFB',
    WHITE: '#FFFFFF',
    DANGER: '#EF4444'
};

function isSameDay(dateA: Date, dateB: Date) {
    return dateA.getFullYear() === dateB.getFullYear() &&
           dateA.getMonth() === dateB.getMonth() &&
           dateA.getDate() === dateB.getDate();
}

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUser] = useState(authStore.getState().user);
    const [refreshing, setRefreshing] = useState(false);
    const [showEarlyModal, setShowEarlyModal] = useState(false);
    const [showFaceRegisterModal, setShowFaceRegisterModal] = useState(false); // State baru
    const [earlyReason, setEarlyReason] = useState('');

    const [todayAttendance, setTodayAttendance] = useState({
        hasCheckedIn: false,
        hasCheckedOut: false,
        checkInTime: null as string | null,
        checkOutTime: null as string | null,
        status: null as string | null,
    });

    const [recentHistory, setRecentHistory] = useState<AttendanceRecord[]>([]);
    const [todayShift, setTodayShift] = useState<any>(null);
    const [overtimeData, setOvertimeData] = useState<any>(null);

    // Observer untuk update user jika ada perubahan profil
    useEffect(() => {
        const unsubscribe = authStore.subscribe((state) => setUser(state.user));
        return unsubscribe;
    }, []);

    // Helper Fungsi
    const formatTime = (timeString: string | null) => {
        if (!timeString) return '--:--';
        let time = timeString.includes('T') ? timeString.split('T')[1] : timeString;
        const [hours, minutes] = time.split(':');
        return hours && minutes ? `${hours}:${minutes}` : timeString;
    };

    const formatDateLabel = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long',
        });
    };

    /**
     * LOGIKA UTAMA: Load Data & Cek Vektor Wajah
     */
    const loadAttendanceData = useCallback(async () => {
        const authState = authStore.getState();
        if (!authState.token || !authState.user?.id) return;

        try {
            const [todayResponse, historyData, shiftData, overtimeResponse, faceVektorRes] = await Promise.all([
                attendanceService.getTodayAttendance(authState.token, authState.user.id),
                attendanceService.getAttendanceHistory(authState.token, authState.user.id, 5),
                masterControlService.getTodayShift(authState.token || ''),
                attendanceService.getOvertimeData(authState.token),
                getUserFaceVector() // Memanggil endpoint show Anda
            ]);

            // VALIDASI WAJAH: Jika response success: false, tampilkan modal
            if (faceVektorRes && faceVektorRes.success === false) {
                setShowFaceRegisterModal(true);
            } else {
                setShowFaceRegisterModal(false);
            }

            if (todayResponse.data) setTodayAttendance(todayResponse.data);
            setRecentHistory(historyData || []);
            setTodayShift(shiftData);
            
            // Logic Overtime
            if (overtimeResponse.success && overtimeResponse.data?.length > 0) {
                const today = new Date();
                const validOvertime = overtimeResponse.data.find(item => {
                    if (item.status?.toLowerCase().includes('reject')) return false;
                    const start = new Date(item.start_time);
                    return isSameDay(today, start);
                });
                setOvertimeData(validOvertime || null);
            }
        } catch (error) {
            console.error("Home Data Sync Error:", error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => { loadAttendanceData(); }, [loadAttendanceData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadAttendanceData();
    };

    const handleCheckOut = async () => {
        if (todayAttendance.hasCheckedOut) return;
        const userShift = await masterControlService.getTodayShift(authStore.getState().token);
        if (!userShift?.shift) return;
        
        if (!masterControlService.canCheckOut(userShift.shift)) {
            setShowEarlyModal(true);
        } else {
            router.push('/check-in?status=checkout');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 1. MODAL WAJIB DAFTAR WAJAH (Z-INDEX TINGGI) */}
            {showFaceRegisterModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.iconCircleWarning}>
                            <Ionicons name="scan-circle" size={50} color={COLORS.WARNING} />
                        </View>
                        <Text style={styles.modalTitle}>Biometrik Diperlukan</Text>
                        <Text style={styles.modalDescription}>
                            Sistem mendeteksi Anda belum mendaftarkan data wajah. Mohon lakukan pendaftaran untuk mulai melakukan presensi.
                        </Text>
                        
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push('/face-register')}
                            style={styles.modalActionBtn}
                        >
                            <Text style={styles.modalActionText}>Daftar Wajah Sekarang</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* 2. MODAL EARLY CHECKOUT */}
            {showEarlyModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentSmall}>
                        <Text style={styles.modalTitleSmall}>Check Out Lebih Awal</Text>
                        <Text style={styles.modalDescriptionSmall}>Berikan alasan mengapa Anda mengakhiri shift lebih cepat.</Text>
                        <TextInput
                            value={earlyReason}
                            onChangeText={setEarlyReason}
                            placeholder="Contoh: Sakit / Urusan Mendadak"
                            style={styles.textArea}
                            multiline
                        />
                        <View style={styles.modalRowAction}>
                            <TouchableOpacity onPress={() => setShowEarlyModal(false)}>
                                <Text style={styles.btnCancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowEarlyModal(false);
                                    router.push(`/check-in?status=checkout&notes=${encodeURIComponent(earlyReason)}`);
                                    setEarlyReason('');
                                }}
                                style={styles.btnConfirmSmall}
                            >
                                <Text style={styles.btnConfirmTextSmall}>Lanjut</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <ScrollView 
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerLeft} onPress={() => router.push('/(tabs)/profile')}>
                        <View style={styles.logoWrapper}>
                            <Image source={require('../../assets/images/logo-pal.png')} style={styles.logo} resizeMode="contain" />
                        </View>
                        <View>
                            <Text style={styles.greeting}>Halo,</Text>
                            <Text style={styles.userName}>{user?.name || 'Karyawan'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* SHIFT CARD */}
                <View style={styles.shiftCard}>
                    <View style={styles.shiftHeader}>
                        <View style={styles.shiftBadge}>
                            <Ionicons name="calendar" size={14} color={COLORS.PRIMARY} />
                            <Text style={styles.shiftBadgeText}>Shift Hari Ini</Text>
                        </View>
                        <Text style={styles.shiftDate}>{formatDateLabel(new Date().toISOString())}</Text>
                    </View>
                    <View style={styles.shiftBody}>
                        <View style={styles.shiftInfoItem}>
                            <Text style={styles.shiftLabel}>Shift</Text>
                            <Text style={styles.shiftValue}>{todayShift?.shift?.schedule || 'N/A'}</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.shiftInfoItem}>
                            <Text style={styles.shiftLabel}>Jam Kerja</Text>
                            <Text style={styles.shiftValue}>
                                {todayShift ? `${formatTime(todayShift.shift.check_in_time)} - ${formatTime(todayShift.shift.check_out_time)}` : '--:--'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* MAIN ATTENDANCE CARD */}
                <View style={styles.mainCard}>
                    <View style={styles.statusRow}>
                        <Text style={styles.cardTitle}>Presensi Anda</Text>
                        <View style={[styles.statusIndicator, { backgroundColor: todayAttendance.hasCheckedIn ? COLORS.SUCCESS_LIGHT : COLORS.WARNING_LIGHT }]}>
                            <View style={[styles.dot, { backgroundColor: todayAttendance.hasCheckedIn ? COLORS.SUCCESS : COLORS.WARNING }]} />
                            <Text style={[styles.statusText, { color: todayAttendance.hasCheckedIn ? '#065F46' : '#92400E' }]}>
                                {todayAttendance.hasCheckedIn ? 'Sudah Masuk' : 'Belum Absen'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.timeContainer}>
                        <View style={styles.timeBox}>
                            <Text style={styles.timeSub}>Masuk</Text>
                            <Text style={styles.timeMain}>{formatTime(todayAttendance.checkInTime)}</Text>
                        </View>
                        <View style={styles.timeBox}>
                            <Text style={styles.timeSub}>Pulang</Text>
                            <Text style={styles.timeMain}>{formatTime(todayAttendance.checkOutTime)}</Text>
                        </View>
                    </View>
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity 
                            style={[styles.btn, styles.btnIn, (todayAttendance.hasCheckedIn || showFaceRegisterModal) && styles.btnDisabled]}
                            disabled={todayAttendance.hasCheckedIn || showFaceRegisterModal}
                            onPress={() => router.push('/check-in?status=checkin')}
                        >
                            <Ionicons name="enter" size={20} color={COLORS.WHITE} />
                            <Text style={styles.btnText}>Check In</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.btn, styles.btnOut, (!todayAttendance.hasCheckedIn || todayAttendance.hasCheckedOut || showFaceRegisterModal) && styles.btnDisabled]}
                            disabled={!todayAttendance.hasCheckedIn || todayAttendance.hasCheckedOut || showFaceRegisterModal}
                            onPress={handleCheckOut}
                        >
                            <Ionicons name="exit" size={20} color={(!todayAttendance.hasCheckedIn || todayAttendance.hasCheckedOut) ? "#9CA3AF" : COLORS.PRIMARY} />
                            <Text style={[styles.btnText, { color: (!todayAttendance.hasCheckedIn || todayAttendance.hasCheckedOut) ? "#9CA3AF" : COLORS.PRIMARY }]}>Check Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* HISTORY SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Riwayat Terakhir</Text>
                    <TouchableOpacity onPress={() => router.push('/history')}>
                        <Text style={styles.linkText}>Lihat Semua</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.historyCard}>
                    {recentHistory.length > 0 ? (
                        recentHistory.map((item, index) => (
                            <View key={index} style={styles.historyItem}>
                                <View style={styles.historyIcon}>
                                    <Ionicons name="time-outline" size={20} color={COLORS.PRIMARY} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.historyType}>{item.type === 'check_in' ? 'Check In' : 'Check Out'}</Text>
                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                                </View>
                                <Text style={styles.historyTime}>{formatTime(item.time)}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyHistory}>
                            <Text style={styles.emptyText}>Belum ada riwayat presensi.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/**
 * STYLES (Professional & Modern)
 */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BG },
    scrollContent: { paddingBottom: 100 },
    
    // MODAL WAJIB DAFTAR WAJAH
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#FFF', borderRadius: 30, padding: 30, width: '85%', alignItems: 'center', elevation: 10
    },
    iconCircleWarning: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.WARNING_LIGHT,
        justifyContent: 'center', alignItems: 'center', marginBottom: 20
    },
    modalTitle: { fontSize: 18, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN, marginBottom: 10, textAlign: 'center' },
    modalDescription: { fontSize: 14, fontFamily: FONT.REGULAR, color: COLORS.TEXT_SUB, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    modalActionBtn: { backgroundColor: COLORS.PRIMARY, paddingVertical: 15, borderRadius: 16, width: '100%', alignItems: 'center' },
    modalActionText: { color: '#FFF', fontFamily: FONT.BOLD, fontSize: 16 },

    // MODAL EARLY CHECKOUT
    modalContentSmall: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '85%' },
    modalTitleSmall: { fontFamily: FONT.BOLD, fontSize: 16, marginBottom: 8 },
    modalDescriptionSmall: { fontFamily: FONT.REGULAR, fontSize: 13, color: COLORS.TEXT_SUB, marginBottom: 15 },
    textArea: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top', fontFamily: FONT.REGULAR },
    modalRowAction: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 20, gap: 15 },
    btnConfirmSmall: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
    btnConfirmTextSmall: { color: '#FFF', fontFamily: FONT.BOLD },
    btnCancelText: { color: COLORS.DANGER, fontFamily: FONT.BOLD },

    // LAYOUT COMPONENTS
    header: { padding: 20, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logoWrapper: { width: 45, height: 45, borderRadius: 12, backgroundColor: COLORS.BG, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    logo: { width: 30, height: 30 },
    greeting: { fontSize: 12, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
    userName: { fontSize: 16, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },

    shiftCard: { margin: 20, backgroundColor: COLORS.WHITE, borderRadius: 20, padding: 16, elevation: 2 },
    shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    shiftBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.PRIMARY_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    shiftBadgeText: { fontSize: 11, color: COLORS.PRIMARY, fontFamily: FONT.BOLD, marginLeft: 4 },
    shiftDate: { fontSize: 12, color: COLORS.TEXT_SUB, fontFamily: FONT.MEDIUM },
    shiftBody: { flexDirection: 'row', alignItems: 'center' },
    shiftInfoItem: { flex: 1 },
    shiftLabel: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
    shiftValue: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
    verticalDivider: { width: 1, height: 30, backgroundColor: '#F3F4F6', marginHorizontal: 15 },

    mainCard: { marginHorizontal: 20, backgroundColor: COLORS.WHITE, borderRadius: 24, padding: 20, elevation: 3 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 16, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 11, fontFamily: FONT.BOLD },
    timeContainer: { flexDirection: 'row', marginBottom: 25 },
    timeBox: { flex: 1, alignItems: 'center' },
    timeSub: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.MEDIUM, marginBottom: 5 },
    timeMain: { fontSize: 24, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
    buttonGroup: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, flexDirection: 'row', height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 6 },
    btnIn: { backgroundColor: COLORS.PRIMARY },
    btnOut: { backgroundColor: COLORS.WHITE, borderWidth: 1.5, borderColor: COLORS.PRIMARY },
    btnText: { fontSize: 13, fontFamily: FONT.BOLD, color: COLORS.WHITE },
    btnDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    linkText: { fontSize: 13, color: COLORS.PRIMARY, fontFamily: FONT.MEDIUM },
    historyCard: { marginHorizontal: 20, backgroundColor: COLORS.WHITE, borderRadius: 20, paddingHorizontal: 16, marginBottom: 20 },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    historyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.PRIMARY_LIGHT, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    historyType: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.SEMIBOLD },
    historyDate: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
    historyTime: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
    emptyHistory: { padding: 30, alignItems: 'center' },
    emptyText: { color: COLORS.TEXT_SUB, fontSize: 13, fontFamily: FONT.REGULAR },
});