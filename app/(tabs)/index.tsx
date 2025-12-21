import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceRecord, attendanceService } from '../../services/attendanceService';
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
};

export default function HomeScreen() {
    // Helper: parse backend time string as local (WIB) time, not UTC
    function parseLocalDateTime(str) {
      if (!str) return null;
      // Accepts 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss'
      let s = str.replace('T', ' ');
      const [datePart, timePart] = s.split(' ');
      if (!datePart || !timePart) return null;
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);
      // JS month is 0-based
      return new Date(year, month - 1, day, hour, minute, second || 0);
    }
  // Removed unused: showNotesModal, setShowNotesModal, notes, setNotes
  const router = useRouter();
  const [user, setUser] = useState(authStore.getState().user);
  // Removed unused: loading, setLoading
  const [refreshing, setRefreshing] = useState(false);

  const [todayAttendance, setTodayAttendance] = useState({
    hasCheckedIn: false,
    hasCheckedOut: false,
    checkInTime: null as string | null,
    checkOutTime: null as string | null,
    status: null as string | null,
    checkInRecord: null as AttendanceRecord | null,
    checkOutRecord: null as AttendanceRecord | null,
  });

  const [recentHistory, setRecentHistory] = useState<AttendanceRecord[]>([]);
  const [todayShift, setTodayShift] = useState<any>(null);
  const [overtimeData, setOvertimeData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      setUser(state.user);
    });
    return unsubscribe;
  }, []);

  // Format Waktu: HH:mm
  const formatTime = (timeString: string | null): string => {
    if (!timeString) return '--:--';
    // Display time as sent from backend, without local timezone conversion
    // Accepts ISO or 'HH:mm:ss' or 'HH:mm' format
    let time = timeString;
    if (timeString.includes('T')) {
      // ISO string: split date and time
      time = timeString.split('T')[1];
    }
    // Remove seconds if present
    const [hours, minutes] = time.split(':');
    if (hours && minutes) {
      return `${hours}:${minutes}`;
    }
    return timeString;
  };

  // Format Tanggal Lengkap (Multi-day support)
  const formatFullDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateLabel = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getStatusBadgeStyle = (status: string | null | undefined) => {
    if (!status) return { bg: '#F3F4F6', text: COLORS.TEXT_SUB };
    const s = status.toLowerCase();
    if (s.includes('approve') || s.includes('setuju')) return { bg: COLORS.SUCCESS_LIGHT, text: COLORS.SUCCESS };
    if (s.includes('reject') || s.includes('tolak')) return { bg: '#FEE2E2', text: '#EF4444' };
    return { bg: COLORS.WARNING_LIGHT, text: COLORS.WARNING };
  };

  const loadAttendanceData = React.useCallback(async () => {
    const authState = authStore.getState();
    if (!authState.token || !authState.user?.id) return;
    try {
      const [todayResponse, historyData, shiftData, overtimeResponse] = await Promise.all([
        attendanceService.getTodayAttendance(authState.token, authState.user.id),
        attendanceService.getAttendanceHistory(authState.token, authState.user.id, 5),
        masterControlService.getTodayShift(authState.token || ''),
        attendanceService.getOvertimeData(authState.token)
      ]);

      if (todayResponse.data) setTodayAttendance(todayResponse.data);
      setRecentHistory(historyData || []);
      setTodayShift(shiftData);
      
      if (overtimeResponse.success && overtimeResponse.data && overtimeResponse.data.length > 0) {
        // Ambil data lembur terbaru yang statusnya bukan rejected
        // Filter lembur: hanya tampilkan jika waktu sekarang di antara start dan end
        const now = new Date();
        // Cari lembur terbaru yang statusnya bukan rejected
        const validOvertime = overtimeResponse.data.find(item => !(item.status && item.status.toLowerCase().includes('reject')));
        if (validOvertime) {
          const start = parseLocalDateTime(validOvertime.start_time);
          const end = parseLocalDateTime(validOvertime.end_time);
          if (start && end && now >= start && now <= end) {
            setOvertimeData(validOvertime);
          } else {
            setOvertimeData(null);
          }
        } else {
          setOvertimeData(null);
        }
      } else {
        setOvertimeData(null);
      }
    } catch (error) {
      console.error("Load Data Error:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { loadAttendanceData(); }, [loadAttendanceData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAttendanceData();
  }, [loadAttendanceData]);

  const handleCheckOut = async () => {
    if (todayAttendance.hasCheckedOut) return;
    const userShift = await masterControlService.getTodayShift(authStore.getState().token);
    if (!userShift || !userShift.shift) return;
    if (!masterControlService.canCheckOut(userShift.shift)) {
      setShowNotesModal(true);
    } else {
      router.push('/check-in?status=checkout');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLeft}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.logoWrapper}>
              <Image source={require('../../assets/images/logo-pal.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.greeting}>Selamat Pagi,</Text>
              <Text style={styles.userName}>{user?.name || 'Karyawan'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* SHIFT CARD */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftBadge}>
              <Ionicons name="calendar" size={14} color={COLORS.PRIMARY} />
              <Text style={styles.shiftBadgeText}>Jadwal Kerja</Text>
            </View>
            <Text style={styles.shiftDate}>{formatDateLabel(new Date().toISOString())}</Text>
          </View>
          <View style={styles.shiftBody}>
            <View style={styles.shiftInfoItem}>
              <Text style={styles.shiftLabel}>Shift Anda</Text>
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

        {/* IMPROVED OVERTIME CARD (MULTI-DAY) */}
        {overtimeData && (
          <View style={styles.modernOvertimeCard}>
            <View style={styles.ovHeader}>
              <View style={styles.ovTitleRow}>
                <View style={styles.ovIconCircle}>
                  <Ionicons name="moon" size={18} color={COLORS.PRIMARY} />
                </View>
                <View>
                  <Text style={styles.ovMainTitle}>Jadwal Lembur</Text>
                  <Text style={styles.ovDateSub}>Pengajuan Aktif</Text>
                </View>
              </View>
              <View style={[styles.ovBadge, { backgroundColor: getStatusBadgeStyle(overtimeData.status).bg }]}>
                <Text style={[styles.ovBadgeText, { color: getStatusBadgeStyle(overtimeData.status).text }]}>
                  {overtimeData.status}
                </Text>
              </View>
            </View>

            <View style={styles.ovDateTimeGrid}>
              <View style={styles.ovTimeBox}>
                <Text style={styles.ovGridLabel}>Mulai</Text>
                <Text style={styles.ovTimeValue}>{formatTime(overtimeData.start_time)}</Text>
                <Text style={styles.ovDateValue}>{formatFullDate(overtimeData.start_time)}</Text>
              </View>
              
              <View style={styles.ovConnector}>
                <View style={styles.ovLine} />
                <View style={styles.ovDurationChip}>
                  <Text style={styles.ovDurationText}>{Math.round(overtimeData.total_minutes / 60)}j</Text>
                </View>
                <View style={styles.ovLine} />
              </View>

              <View style={[styles.ovTimeBox, { alignItems: 'flex-end' }]}>
                <Text style={[styles.ovGridLabel, { textAlign: 'right' }]}>Selesai</Text>
                <Text style={[styles.ovTimeValue, { textAlign: 'right' }]}>{formatTime(overtimeData.end_time)}</Text>
                <Text style={[styles.ovDateValue, { textAlign: 'right' }]}>{formatFullDate(overtimeData.end_time)}</Text>
              </View>
            </View>

            {overtimeData.reason && (
              <View style={styles.ovReasonBox}>
                <Ionicons name="document-text-outline" size={14} color={COLORS.TEXT_SUB} />
                <Text style={styles.ovReasonText} numberOfLines={1}>
                  {overtimeData.reason}
                </Text>
              </View>
            )}
            
            <View style={styles.ovFooter}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.ACCENT} />
              <Text style={styles.ovFooterText}>Total durasi: {overtimeData.total_minutes} menit</Text>
            </View>
          </View>
        )}

        {/* MAIN ATTENDANCE CARD */}
        <View style={styles.mainCard}>
          <View style={styles.statusRow}>
            <Text style={styles.cardTitle}>Presensi Hari Ini</Text>
            <View style={[styles.statusIndicator, { backgroundColor: todayAttendance.hasCheckedIn ? COLORS.SUCCESS_LIGHT : COLORS.WARNING_LIGHT }]}>
              <View style={[styles.dot, { backgroundColor: todayAttendance.hasCheckedIn ? COLORS.SUCCESS : COLORS.WARNING }]} />
              <Text style={[styles.statusText, { color: todayAttendance.hasCheckedIn ? '#065F46' : '#92400E' }]}>
                {todayAttendance.hasCheckedIn ? 'Sudah Masuk' : 'Belum Absen'}
              </Text>
            </View>
          </View>
          <View style={styles.timeContainer}>
            <View style={styles.timeBox}>
              <Text style={styles.timeSub}>Check In</Text>
              <Text style={styles.timeMain}>{formatTime(todayAttendance.checkInTime)}</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeSub}>Check Out</Text>
              <Text style={styles.timeMain}>{formatTime(todayAttendance.checkOutTime)}</Text>
            </View>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnIn, todayAttendance.hasCheckedIn && styles.btnDisabled]}
              disabled={todayAttendance.hasCheckedIn}
              onPress={() => router.push('/check-in?status=checkin')}
            >
              <Ionicons name="enter" size={20} color={COLORS.WHITE} />
              <Text style={styles.btnText}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnOut, (!todayAttendance.hasCheckedIn || todayAttendance.hasCheckedOut) && styles.btnDisabled]}
              disabled={!todayAttendance.hasCheckedIn || todayAttendance.hasCheckedOut}
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
              <View key={item.id || index} style={[styles.historyItem, index === recentHistory.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.historyIcon, { backgroundColor: COLORS.PRIMARY_LIGHT }]}>
                  <Ionicons name="time-outline" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyType}>{item.type === 'check_in' ? 'Check In' : 'Check Out'}</Text>
                  <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={styles.historyTime}>{formatTime(item.time)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>Belum ada riwayat</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  scrollContent: { paddingBottom: 30 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 20, 
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoWrapper: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.BG, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logo: { width: 32, height: 32 },
  greeting: { fontSize: 12, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
  userName: { fontSize: 16, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },

  shiftCard: { margin: 20, backgroundColor: COLORS.WHITE, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2 },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  shiftBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.PRIMARY_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  shiftBadgeText: { fontSize: 11, color: COLORS.PRIMARY, fontFamily: FONT.BOLD, marginLeft: 4 },
  shiftDate: { fontSize: 12, color: COLORS.TEXT_SUB, fontFamily: FONT.MEDIUM },
  shiftBody: { flexDirection: 'row', alignItems: 'center' },
  shiftInfoItem: { flex: 1 },
  shiftLabel: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR, marginBottom: 2 },
  shiftValue: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
  verticalDivider: { width: 1, height: 30, backgroundColor: '#F3F4F6', marginHorizontal: 15 },
  
  // MODERN OVERTIME CARD STYLES
  modernOvertimeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  ovHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  ovTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ovIconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.PRIMARY_LIGHT, justifyContent: 'center', alignItems: 'center' },
  ovMainTitle: { fontSize: 16, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
  ovDateSub: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
  ovBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ovBadgeText: { fontSize: 10, fontFamily: FONT.BOLD, textTransform: 'uppercase' },
  
  ovDateTimeGrid: { 
    flexDirection: 'row', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    padding: 15, 
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ovTimeBox: { flex: 2 },
  ovGridLabel: { fontSize: 9, color: COLORS.TEXT_SUB, fontFamily: FONT.MEDIUM, textTransform: 'uppercase', marginBottom: 2 },
  ovTimeValue: { fontSize: 20, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
  ovDateValue: { fontSize: 11, color: COLORS.TEXT_MAIN, fontFamily: FONT.MEDIUM },
  
  ovConnector: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ovLine: { width: 1, height: 10, backgroundColor: '#CBD5E1' },
  ovDurationChip: { backgroundColor: COLORS.WHITE, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 2 },
  ovDurationText: { fontSize: 9, fontFamily: FONT.BOLD, color: COLORS.PRIMARY },

  ovReasonBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 4 },
  ovReasonText: { fontSize: 13, color: '#475569', fontFamily: FONT.REGULAR, fontStyle: 'italic', flex: 1 },
  ovFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  ovFooterText: { fontSize: 11, color: COLORS.ACCENT, fontFamily: FONT.MEDIUM },

  mainCard: { marginHorizontal: 20, backgroundColor: COLORS.WHITE, borderRadius: 24, padding: 20, elevation: 3 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontFamily: FONT.BOLD },
  timeContainer: { flexDirection: 'row', marginBottom: 25 },
  timeBox: { flex: 1, alignItems: 'center' },
  timeSub: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.MEDIUM, marginBottom: 5 },
  timeMain: { fontSize: 24, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
  buttonGroup: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnIn: { backgroundColor: COLORS.PRIMARY },
  btnOut: { backgroundColor: COLORS.WHITE, borderWidth: 1.5, borderColor: COLORS.PRIMARY },
  btnText: { fontSize: 14, fontFamily: FONT.BOLD, color: COLORS.WHITE },
  btnDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
  linkText: { fontSize: 13, color: COLORS.PRIMARY, fontFamily: FONT.MEDIUM },
  historyCard: { marginHorizontal: 20, backgroundColor: COLORS.WHITE, borderRadius: 20, paddingHorizontal: 16, marginBottom: 20 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  historyIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyType: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.SEMIBOLD },
  historyDate: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
  historyTime: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
  emptyHistory: { padding: 30, alignItems: 'center' },
  emptyText: { color: COLORS.TEXT_SUB, fontSize: 13, fontFamily: FONT.REGULAR },
});