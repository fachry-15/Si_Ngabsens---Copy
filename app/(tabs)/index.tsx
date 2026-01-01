import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceRecord, attendanceService } from '../../services/attendanceService';
import { getUserFaceVector } from '../../services/faceVectorService';
import { masterControlService } from '../../services/masterControlService';
import { authStore } from '../../store/authStore';

const FONT = {
    REGULAR: 'Fredoka-Regular',
    MEDIUM: 'Fredoka-Medium',
    SEMIBOLD: 'Fredoka-SemiBold',
    BOLD: 'Fredoka-Bold',
};

const COLORS = {
    PRIMARY: '#2b5597',
    PRIMARY_SOFT: '#EBF2FF',
    ACCENT: '#6366F1',
    TEXT_MAIN: '#1E293B',
    TEXT_SUB: '#64748B',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    BG: '#F8FAFC',
    WHITE: '#FFFFFF',
    BORDER: '#F1F5F9',
    DANGER: '#EF4444'
};

export default function HomeScreen() {
    const router = useRouter();
    const [user, setUser] = useState(authStore.getState().user);
    const [refreshing, setRefreshing] = useState(false);
    const [showFaceRegisterModal, setShowFaceRegisterModal] = useState(false);
    
    const [todayAttendance, setTodayAttendance] = useState({
        hasCheckedIn: false,
        hasCheckedOut: false,
        checkInTime: null as string | null,
        checkOutTime: null as string | null,
    });

    const [recentHistory, setRecentHistory] = useState<AttendanceRecord[]>([]);
    const [todayShift, setTodayShift] = useState<any>(null);
    const [overtimeData, setOvertimeData] = useState<any>(null);

    // --- Helper Functions ---
    const formatTime = (timeString: string | null) => {
        if (!timeString) return '--:--';
        let time = timeString.includes('T') ? timeString.split('T')[1] : timeString;
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
    };

    const formatDateSmall = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const isSameDay = (dateA: Date, dateB: Date) => {
        return dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
               dateA.getUTCMonth() === dateB.getUTCMonth() &&
               dateA.getUTCDate() === dateB.getUTCDate();
    };

    const loadAttendanceData = useCallback(async () => {
        const authState = authStore.getState();
        if (!authState.token || !authState.user?.id) return;
        try {
            const [todayResponse, historyData, shiftData, overtimeResponse, faceVektorRes] = await Promise.all([
                attendanceService.getTodayAttendance(authState.token, authState.user.id),
                attendanceService.getAttendanceHistory(authState.token, authState.user.id, 5),
                masterControlService.getTodayShift(authState.token || ''),
                attendanceService.getOvertimeData(authState.token),
                getUserFaceVector()
            ]);

            if (faceVektorRes?.success === false) setShowFaceRegisterModal(true);
            if (todayResponse.data) setTodayAttendance(todayResponse.data);
            setRecentHistory(historyData || []);
            setTodayShift(shiftData);
            
            if (overtimeResponse.success && overtimeResponse.data?.length > 0) {
                const today = new Date();
                const validOvertime = overtimeResponse.data.find((item: any) => {
                    const status = (item.status || '').toLowerCase();
                    if (status.includes('reject') || status.includes('cancel')) return false;
                    return isSameDay(today, new Date(item.start_time));
                });
                setOvertimeData(validOvertime || null);
            }
        } catch (e) { console.error(e); } finally { setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { loadAttendanceData(); }, [loadAttendanceData]));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BG} />

            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAttendanceData(); }} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Halo, Selamat Bekerja!</Text>
                        <Text style={styles.userName}>{user?.name || 'Karyawan'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.profileBtn}>
                        <Image source={require('../../assets/images/logo-pal.png')} style={styles.logo} />
                    </TouchableOpacity>
                </View>

                {/* SHIFT CARD */}
                <View style={styles.shiftCard}>
                    <View style={styles.shiftHeader}>
                        <View style={styles.badgePrimary}>
                            <Ionicons name="calendar-outline" size={12} color={COLORS.PRIMARY} />
                            <Text style={styles.badgeTextPrimary}>JADWAL HARI INI</Text>
                        </View>
                        <Text style={styles.shiftDate}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
                    </View>
                    <View style={styles.shiftBody}>
                        <View style={styles.shiftItem}>
                            <Text style={styles.labelSmall}>Shift</Text>
                            <Text style={styles.valueMedium}>{todayShift?.shift?.schedule || 'N/A'}</Text>
                        </View>
                        <View style={styles.vDivider} />
                        <View style={styles.shiftItem}>
                            <Text style={styles.labelSmall}>Jam Kerja</Text>
                            <Text style={styles.valueMedium}>
                                {todayShift ? `${formatTime(todayShift.shift.check_in_time)} - ${formatTime(todayShift.shift.check_out_time)}` : '--:--'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* OVERTIME CARD (BEDA HARI SUPPORT) */}
                {overtimeData && (
                    <View style={styles.overtimeCard}>
                        <View style={styles.overtimeHeader}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                <Ionicons name="moon" size={16} color={COLORS.ACCENT} />
                                <Text style={styles.overtimeTitle}>Lembur Terjadwal</Text>
                            </View>
                            <View style={styles.badgeSuccess}>
                                <Text style={styles.badgeTextSuccess}>{overtimeData.status.toUpperCase()}</Text>
                            </View>
                        </View>
                        <View style={styles.overtimeTimeRow}>
                            <View style={styles.otTimeBox}>
                                <Text style={styles.labelMicro}>{formatDateSmall(overtimeData.start_time)}</Text>
                                <Text style={styles.valueSmall}>{formatTime(overtimeData.start_time)}</Text>
                                <Text style={styles.labelMicro}>Mulai</Text>
                            </View>
                            <Ionicons name="arrow-forward" size={14} color={COLORS.TEXT_SUB} />
                            <View style={styles.otTimeBox}>
                                <Text style={styles.labelMicro}>{formatDateSmall(overtimeData.end_time)}</Text>
                                <Text style={styles.valueSmall}>{formatTime(overtimeData.end_time)}</Text>
                                <Text style={styles.labelMicro}>Selesai</Text>
                            </View>
                            <View style={styles.otDurationBadge}>
                                <Text style={styles.otDurationText}>{Math.round(overtimeData.total_minutes / 60)} Jam</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ATTENDANCE CARD */}
                <View style={styles.attendanceMainCard}>
                    <View style={styles.cardInfoRow}>
                        <Text style={styles.cardHeading}>STATUS KEHADIRAN</Text>
                        <View style={[styles.dotStatus, { backgroundColor: todayAttendance.hasCheckedIn ? COLORS.SUCCESS : COLORS.WARNING }]} />
                    </View>
                    <View style={styles.mainTimeRow}>
                        <View style={styles.mainTimeItem}>
                            <Text style={styles.timeVal}>{formatTime(todayAttendance.checkInTime)}</Text>
                            <Text style={styles.timeLab}>Masuk</Text>
                        </View>
                        <View style={styles.mainTimeItem}>
                            <Text style={styles.timeVal}>{formatTime(todayAttendance.checkOutTime)}</Text>
                            <Text style={styles.timeLab}>Pulang</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={[styles.btnPrimary, todayAttendance.hasCheckedOut && styles.btnDisabled]} 
                        onPress={() => !todayAttendance.hasCheckedIn ? router.push('/check-in?status=checkin') : router.push('/check-in?status=checkout')}
                        disabled={todayAttendance.hasCheckedOut}
                    >
                        <Ionicons name={!todayAttendance.hasCheckedIn ? "scan-outline" : "log-out-outline"} size={20} color={COLORS.WHITE} />
                        <Text style={styles.btnTextPrimary}>
                            {todayAttendance.hasCheckedOut ? 'Sudah Selesai' : !todayAttendance.hasCheckedIn ? 'Check In Sekarang' : 'Check Out Sekarang'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* HISTORY SECTION */}
                <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>Riwayat Terakhir</Text>
                    <TouchableOpacity onPress={() => router.push('/history')}>
                        <Text style={styles.viewAll}>Lihat Semua</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.historyList}>
                    {recentHistory.length > 0 ? (
                        recentHistory.map((item, index) => (
                            <View key={index} style={styles.historyRow}>
                                <View style={styles.historyIcon}>
                                    <Ionicons name={item.type === 'check_in' ? "arrow-down-circle" : "arrow-up-circle"} size={22} color={item.type === 'check_in' ? COLORS.SUCCESS : COLORS.PRIMARY} />
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.historyType}>{item.type === 'check in' ? 'Check In' : 'Check Out'}</Text>
                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                                </View>
                                <Text style={styles.historyTime}>{formatTime(item.time)}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="document-text-outline" size={32} color={COLORS.BORDER} />
                            <Text style={styles.emptyText}>Belum ada riwayat absensi yang terekam</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BG },
    scrollContent: { paddingBottom: 40, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 25 },
    greeting: { fontSize: 13, fontFamily: FONT.REGULAR, color: COLORS.TEXT_SUB },
    userName: { fontSize: 22, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    profileBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.WHITE, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.BORDER },
    logo: { width: 26, height: 26, resizeMode: 'contain' },
    shiftCard: { backgroundColor: COLORS.WHITE, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.BORDER },
    shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    badgePrimary: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.PRIMARY_SOFT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeTextPrimary: { fontSize: 10, fontFamily: FONT.BOLD, color: COLORS.PRIMARY },
    shiftDate: { fontSize: 11, fontFamily: FONT.MEDIUM, color: COLORS.TEXT_SUB },
    shiftBody: { flexDirection: 'row', alignItems: 'center' },
    shiftItem: { flex: 1 },
    labelSmall: { fontSize: 10, fontFamily: FONT.MEDIUM, color: COLORS.TEXT_SUB, marginBottom: 2 },
    valueMedium: { fontSize: 15, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    vDivider: { width: 1, height: 25, backgroundColor: COLORS.BORDER, marginHorizontal: 15 },
    overtimeCard: { backgroundColor: '#F0F4FF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#D0E0FF' },
    overtimeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    overtimeTitle: { fontSize: 13, fontFamily: FONT.BOLD, color: COLORS.ACCENT },
    badgeSuccess: { backgroundColor: COLORS.SUCCESS, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeTextSuccess: { fontSize: 9, fontFamily: FONT.BOLD, color: COLORS.WHITE },
    overtimeTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    otTimeBox: { alignItems: 'center' },
    valueSmall: { fontSize: 16, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    labelMicro: { fontSize: 9, fontFamily: FONT.REGULAR, color: COLORS.TEXT_SUB },
    otDurationBadge: { marginLeft: 'auto', backgroundColor: COLORS.WHITE, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#D0E0FF' },
    otDurationText: { fontSize: 11, fontFamily: FONT.BOLD, color: COLORS.ACCENT },
    attendanceMainCard: { backgroundColor: COLORS.WHITE, borderRadius: 30, padding: 24, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER, marginBottom: 25 },
    cardInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardHeading: { fontSize: 11, fontFamily: FONT.BOLD, color: COLORS.TEXT_SUB, letterSpacing: 1 },
    dotStatus: { width: 8, height: 8, borderRadius: 4 },
    mainTimeRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 },
    mainTimeItem: { alignItems: 'center' },
    timeVal: { fontSize: 32, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    timeLab: { fontSize: 12, fontFamily: FONT.MEDIUM, color: COLORS.TEXT_SUB },
    btnPrimary: { backgroundColor: COLORS.PRIMARY, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    btnTextPrimary: { color: COLORS.WHITE, fontSize: 16, fontFamily: FONT.BOLD },
    btnDisabled: { opacity: 0.5, backgroundColor: COLORS.BG },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    viewAll: { fontSize: 13, fontFamily: FONT.MEDIUM, color: COLORS.PRIMARY },
    historyList: { gap: 12 },
    historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: COLORS.BORDER },
    historyIcon: { marginRight: 15 },
    historyType: { fontSize: 14, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    historyDate: { fontSize: 11, fontFamily: FONT.REGULAR, color: COLORS.TEXT_SUB },
    historyTime: { fontSize: 15, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
    emptyCard: { alignItems: 'center', padding: 30, backgroundColor: COLORS.WHITE, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.BORDER },
    emptyText: { marginTop: 10, fontSize: 13, color: COLORS.TEXT_SUB, textAlign: 'center' }
});