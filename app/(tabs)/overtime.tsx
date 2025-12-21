import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { overtimeService, OvertimeRecord } from '../../services/overtimeService';
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
  DANGER: '#EF4444',
  DANGER_LIGHT: '#FEE2E2',
  BG: '#F9FAFB',
  WHITE: '#FFFFFF',
};

export default function OvertimeScheduleScreen() {
  const [loading, setLoading] = useState(true);
  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOvertimes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { token } = authStore.getState();
      if (!token) return;
      const data = await overtimeService.getUserOvertimes(token);
      setOvertimes(data);
    } catch (e) {
      console.error("Error fetching overtimes:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOvertimes();
  }, []);

  const formatFullDateTime = (isoString: string) => {
    // Display date and time as sent from backend, without local timezone conversion
    // Accepts ISO or 'YYYY-MM-DDTHH:mm:ss' or 'YYYY-MM-DD HH:mm:ss'
    let datePart = isoString;
    let timePart = '';
    if (isoString.includes('T')) {
      [datePart, timePart] = isoString.split('T');
    } else if (isoString.includes(' ')) {
      [datePart, timePart] = isoString.split(' ');
    }
    // Format date: 2025-12-22 -> 22 Des 2025
    let dateDisplay = '-';
    let dayName = '-';
    if (datePart && datePart.includes('-')) {
      const [year, month, day] = datePart.split('-');
      if (year && month && day) {
        const dateObj = new Date(`${year}-${month}-${day}`);
        dateDisplay = dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
      }
    }
    // Format time: HH:mm:ss or HH:mm
    let timeDisplay = '--:--';
    if (timePart) {
      const [hours, minutes] = timePart.split(':');
      if (hours && minutes) {
        timeDisplay = `${hours}:${minutes}`;
      }
    }
    return {
      dateDisplay,
      timeDisplay,
      dayName,
    };
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('approve')) return { bg: COLORS.SUCCESS_LIGHT, text: COLORS.SUCCESS, icon: 'checkmark-circle' };
    if (s.includes('reject')) return { bg: COLORS.DANGER_LIGHT, text: COLORS.DANGER, icon: 'close-circle' };
    return { bg: COLORS.WARNING_LIGHT, text: COLORS.WARNING, icon: 'time' };
  };

  const renderItem = ({ item }: { item: OvertimeRecord }) => {
    const start = formatFullDateTime(item.start_time);
    const end = formatFullDateTime(item.end_time);
    const status = getStatusBadge(item.status);

    return (
      <View style={styles.card}>
        {/* TOP STATUS BAR */}
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.ovIconCircle}>
              <Ionicons name="moon" size={16} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.ovLabel}>Detail Lembur</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon as any} size={12} color={status.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: status.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* TIME & DATE SECTION (SUPPORT MULTI-DAY) */}
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeBox}>
            <Text style={styles.dtLabel}>Mulai</Text>
            <Text style={styles.dtTime}>{start.timeDisplay}</Text>
            <Text style={styles.dtDate}>{start.dateDisplay}</Text>
            <Text style={styles.dtDay}>{start.dayName}</Text>
          </View>

          <View style={styles.arrowConnector}>
            <View style={styles.line} />
            <View style={styles.durationChip}>
               <Text style={styles.durationText}>{Math.round(item.total_minutes / 60)} Jam</Text>
            </View>
            <View style={styles.line} />
          </View>

          <View style={[styles.dateTimeBox, { alignItems: 'flex-end' }]}>
            <Text style={[styles.dtLabel, { textAlign: 'right' }]}>Selesai</Text>
            <Text style={[styles.dtTime, { textAlign: 'right' }]}>{end.timeDisplay}</Text>
            <Text style={[styles.dtDate, { textAlign: 'right' }]}>{end.dateDisplay}</Text>
            <Text style={[styles.dtDay, { textAlign: 'right' }]}>{end.dayName}</Text>
          </View>
        </View>

        {/* REASON BOX */}
        <View style={styles.reasonContainer}>
          <Ionicons name="document-text-outline" size={14} color={COLORS.TEXT_SUB} />
          <Text style={styles.reasonText} numberOfLines={2}>
            {item.reason || 'Tidak ada alasan'}
          </Text>
        </View>

        {/* FOOTER TOTAL */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.ACCENT} />
          <Text style={styles.footerText}>Total akumulasi lembur: {item.total_minutes} menit</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Jadwal Lembur</Text>
        <Text style={styles.screenSubtitle}>Pantau riwayat lembur lintas tanggal</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={overtimes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchOvertimes(true)} colors={[COLORS.PRIMARY]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="clipboard-outline" size={40} color={COLORS.TEXT_SUB} />
              <Text style={styles.emptyText}>Belum ada pengajuan lembur</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  screenTitle: { fontSize: 24, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
  screenSubtitle: { fontSize: 13, fontFamily: FONT.REGULAR, color: COLORS.TEXT_SUB, marginTop: 2 },
  listPadding: { padding: 20, paddingBottom: 100 },
  
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ovIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovLabel: { fontSize: 14, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.BOLD, textTransform: 'uppercase' },

  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 15,
  },
  dateTimeBox: { flex: 2 },
  dtLabel: { fontSize: 10, fontFamily: FONT.MEDIUM, color: COLORS.TEXT_SUB, textTransform: 'uppercase', marginBottom: 4 },
  dtTime: { fontSize: 22, fontFamily: FONT.BOLD, color: COLORS.TEXT_MAIN },
  dtDate: { fontSize: 12, fontFamily: FONT.SEMIBOLD, color: COLORS.TEXT_MAIN, marginTop: 2 },
  dtDay: { fontSize: 11, fontFamily: FONT.REGULAR, color: COLORS.TEXT_SUB },
  
  arrowConnector: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  line: { width: 1, height: 15, backgroundColor: '#CBD5E1' },
  durationChip: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  durationText: { fontSize: 9, fontFamily: FONT.BOLD, color: COLORS.PRIMARY },

  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  reasonText: { flex: 1, fontSize: 13, fontFamily: FONT.REGULAR, color: '#475569', fontStyle: 'italic' },
  
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: { fontSize: 11, fontFamily: FONT.MEDIUM, color: COLORS.ACCENT },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyView: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: FONT.REGULAR, color: COLORS.TEXT_SUB },
});