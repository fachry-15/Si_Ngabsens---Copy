import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const [user, setUser] = useState(authStore.getState().user);
  const [loading, setLoading] = useState(true);
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

  const [monthlyStats, setMonthlyStats] = useState({
    checkInCount: 0,
    checkOutCount: 0,
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

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return '--:--';
    const time = timeString.includes('T') ? timeString.split('T')[1] : timeString;
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getStatusBadgeStyle = (status: string | null | undefined) => {
    if (!status) return { bg: 'transparent', text: 'transparent' };
    const s = status.toLowerCase();
    if (s.includes('terlambat')) return { bg: '#FEE2E2', text: '#EF4444' };
    if (s.includes('awal')) return { bg: '#DBEAFE', text: '#3B82F6' };
    if (s.includes('tepat') || s.includes('sesuai')) return { bg: COLORS.SUCCESS_LIGHT, text: COLORS.SUCCESS };
    return { bg: '#F3F4F6', text: COLORS.TEXT_SUB };
  };

  const loadAttendanceData = async () => {
    const authState = authStore.getState();
    if (!authState.token || !authState.user?.id) return;
    try {
      if (!refreshing) setLoading(true);
      const [todayResponse, monthlyResponse, historyData, shiftData, overtimeResponse] = await Promise.all([
        attendanceService.getTodayAttendance(authState.token, authState.user.id),
        attendanceService.getMonthlyStats(authState.token, authState.user.id),
        attendanceService.getAttendanceHistory(authState.token, authState.user.id, 5),
        masterControlService.getTodayShift(authState.token),
        attendanceService.getOvertimeData(authState.token, authState.user.id)
      ]);

      if (todayResponse.data) setTodayAttendance(todayResponse.data);
      if (monthlyResponse.data) {
        setMonthlyStats({
          checkInCount: monthlyResponse.data.checkInCount ?? 0,
          checkOutCount: monthlyResponse.data.checkOutCount ?? 0,
        });
      }
      
      setRecentHistory(historyData || []);
      setTodayShift(shiftData);
      
      if (overtimeResponse.success && overtimeResponse.data && overtimeResponse.data.length > 0) {
        setOvertimeData(overtimeResponse.data[0]);
      } else {
        setOvertimeData(null);
      }
    } catch (error) {
      console.error("Load Data Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadAttendanceData(); }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAttendanceData();
  }, []);

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
        {/* HEADER: Navigasi Profil via Logo */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLeft}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/images/logo-pal.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
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
            <Text style={styles.shiftDate}>{formatDate(new Date().toISOString())}</Text>
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

        {/* MODERN OVERTIME CARD */}
        {overtimeData && (
          <View style={styles.modernOvertimeCard}>
            <View style={styles.ovHeader}>
              <View style={styles.ovTitleRow}>
                <View style={styles.ovIconCircle}>
                  <Ionicons name="moon" size={18} color={COLORS.ACCENT} />
                </View>
                <View>
                  <Text style={styles.ovMainTitle}>Jadwal Lembur</Text>
                  <Text style={styles.ovDateSub}>{formatDate(overtimeData.date)}</Text>
                </View>
              </View>
              <View style={styles.ovBadgeApproved}>
                <Text style={styles.ovBadgeText}>{overtimeData.status}</Text>
              </View>
            </View>
            <View style={styles.ovInfoGrid}>
              <View style={styles.ovGridItem}>
                <Text style={styles.ovGridLabel}>Waktu Lembur</Text>
                <View style={styles.ovTimeRow}>
                  <Ionicons name="time-outline" size={16} color={COLORS.TEXT_MAIN} />
                  <Text style={styles.ovGridValue}>
                    {formatTime(overtimeData.start_time)} - {formatTime(overtimeData.end_time)}
                  </Text>
                </View>
              </View>
              <View style={styles.ovGridItemMini}>
                <Text style={styles.ovGridLabel}>Durasi</Text>
                <View style={styles.ovTimeRow}>
                  <Ionicons name="hourglass-outline" size={16} color={COLORS.TEXT_MAIN} />
                  <Text style={styles.ovGridValue}>{Math.floor(overtimeData.total_minutes / 60)} Jam</Text>
                </View>
              </View>
            </View>
            {overtimeData.reason && (
              <View style={styles.ovReasonBox}>
                <Text style={styles.ovReasonText} numberOfLines={1}>
                  📌 Alasan: {overtimeData.reason}
                </Text>
              </View>
            )}
            <View style={styles.ovFooter}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.ACCENT} />
              <Text style={styles.ovFooterText}>Checkout tersedia setelah jam lembur selesai</Text>
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
              {todayAttendance.checkInRecord?.keterangan && (
                <View style={[styles.badgeKeterangan, { backgroundColor: getStatusBadgeStyle(todayAttendance.checkInRecord.keterangan).bg }]}>
                  <Text style={[styles.badgeTextKeterangan, { color: getStatusBadgeStyle(todayAttendance.checkInRecord.keterangan).text }]}>
                    {todayAttendance.checkInRecord.keterangan}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeSub}>Check Out</Text>
              <Text style={styles.timeMain}>{formatTime(todayAttendance.checkOutTime)}</Text>
              {todayAttendance.checkOutRecord?.keterangan && (
                <View style={[styles.badgeKeterangan, { backgroundColor: getStatusBadgeStyle(todayAttendance.checkOutRecord.keterangan).bg }]}>
                  <Text style={[styles.badgeTextKeterangan, { color: getStatusBadgeStyle(todayAttendance.checkOutRecord.keterangan).text }]}>
                    {todayAttendance.checkOutRecord.keterangan}
                  </Text>
                </View>
              )}
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

        {/* RIWAYAT TERAKHIR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Terakhir</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.linkText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          {recentHistory && recentHistory.length > 0 ? (
            recentHistory.map((item, index) => {
              const badgeStyle = getStatusBadgeStyle(item.keterangan);
              const isIn = (item.status || '').toLowerCase().includes('in') || item.type === 'check_in';
              
              return (
                <View key={item.id || index} style={[styles.historyItem, index === recentHistory.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.historyIcon, { backgroundColor: isIn ? COLORS.PRIMARY_LIGHT : '#FFF7ED' }]}>
                    <Ionicons 
                      name={isIn ? "arrow-down-circle" : "arrow-up-circle"} 
                      size={22} 
                      color={isIn ? COLORS.PRIMARY : "#F97316"} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyHeaderRow}>
                      <Text style={styles.historyType}>{isIn ? 'Check In' : 'Check Out'}</Text>
                      {item.keterangan && (
                        <View style={[styles.miniBadge, { backgroundColor: badgeStyle.bg }]}>
                          <Text style={[styles.miniBadgeText, { color: badgeStyle.text }]}>{item.keterangan}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.historySubRow}>
                      <Ionicons name="location-outline" size={12} color={COLORS.TEXT_SUB} />
                      <Text style={styles.historyArea}>{item.area || 'Area Terdeteksi'}</Text>
                      <Text style={styles.historyDot}>•</Text>
                      <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>
                  <Text style={styles.historyTime}>{formatTime(item.time)}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={32} color={COLORS.TEXT_SUB} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>Belum ada riwayat presensi</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL CHECKOUT AWAL */}
      <Modal visible={showNotesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Check Out Lebih Awal</Text>
            <Text style={styles.modalDesc}>Berikan alasan mengapa Anda mengakhiri shift lebih cepat.</Text>
            <TextInput style={styles.modalInput} placeholder="Alasan..." multiline value={notes} onChangeText={setNotes} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnSec} onPress={() => setShowNotesModal(false)}>
                <Text style={styles.modalBtnTextSec}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPri} onPress={() => { setShowNotesModal(false); router.push(`/check-in?status=checkout&notes=${encodeURIComponent(notes)}`); }}>
                <Text style={styles.modalBtnTextPri}>Lanjutkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  logoWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
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
  
  modernOvertimeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    shadowColor: COLORS.ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  ovHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  ovTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ovIconCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.PRIMARY_LIGHT, justifyContent: 'center', alignItems: 'center' },
  ovMainTitle: { fontSize: 16, fontFamily: FONT.BOLD, color: '#1E1B4B' },
  ovDateSub: { fontSize: 12, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
  ovBadgeApproved: { backgroundColor: COLORS.SUCCESS_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ovBadgeText: { fontSize: 10, color: '#166534', fontFamily: FONT.BOLD, textTransform: 'uppercase' },
  ovInfoGrid: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, gap: 12 },
  ovGridItem: { flex: 2 }, 
  ovGridItemMini: { flex: 1 },
  ovGridLabel: { fontSize: 10, color: COLORS.TEXT_SUB, fontFamily: FONT.MEDIUM, marginBottom: 4, textTransform: 'uppercase' },
  ovTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ovGridValue: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
  ovReasonBox: { marginTop: 14, paddingHorizontal: 4 },
  ovReasonText: { fontSize: 13, color: '#475569', fontFamily: FONT.REGULAR, fontStyle: 'italic' },
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
  badgeKeterangan: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'center' },
  badgeTextKeterangan: { fontSize: 10, fontFamily: FONT.SEMIBOLD, textTransform: 'capitalize' },
  buttonGroup: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnIn: { backgroundColor: COLORS.PRIMARY },
  btnOut: { backgroundColor: COLORS.WHITE, borderWidth: 1.5, borderColor: COLORS.PRIMARY },
  btnText: { fontSize: 14, fontFamily: FONT.BOLD, color: COLORS.WHITE },
  btnDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
  linkText: { fontSize: 13, color: COLORS.PRIMARY, fontFamily: FONT.MEDIUM },
  historyCard: { marginHorizontal: 20, backgroundColor: COLORS.WHITE, borderRadius: 20, paddingHorizontal: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  historyIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  historyType: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.SEMIBOLD },
  miniBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  miniBadgeText: { fontSize: 9, fontFamily: FONT.BOLD, textTransform: 'uppercase' },
  historySubRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyArea: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.MEDIUM },
  historyDot: { fontSize: 11, color: '#D1D5DB' },
  historyDate: { fontSize: 11, color: COLORS.TEXT_SUB, fontFamily: FONT.REGULAR },
  historyTime: { fontSize: 14, color: COLORS.TEXT_MAIN, fontFamily: FONT.BOLD },
  emptyHistory: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.TEXT_SUB, fontSize: 13, fontFamily: FONT.REGULAR },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: COLORS.WHITE, borderRadius: 24, padding: 25 },
  modalTitle: { fontSize: 18, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN, marginBottom: 10 },
  modalDesc: { fontSize: 14, color: COLORS.TEXT_SUB, marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: COLORS.BG, borderRadius: 15, padding: 15, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E5E7EB' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtnSec: { flex: 1, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modalBtnPri: { flex: 2, height: 50, borderRadius: 15, backgroundColor: COLORS.PRIMARY, alignItems: 'center', justifyContent: 'center' },
  modalBtnTextSec: { color: COLORS.TEXT_SUB, fontFamily: FONT.BOLD },
  modalBtnTextPri: { color: COLORS.WHITE, fontFamily: FONT.BOLD },
});