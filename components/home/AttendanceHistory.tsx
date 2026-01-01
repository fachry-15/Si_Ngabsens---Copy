import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT } from '@/constants/home';
import { AttendanceHistoryItem } from '@/types/home';
import { formatTime } from '@/utils/dateHelper';

interface AttendanceHistoryProps {
  historyData: AttendanceHistoryItem[];
  onViewAllPress: () => void;
}

export function AttendanceHistory({
  historyData,
  onViewAllPress,
}: AttendanceHistoryProps): React.JSX.Element {
  return (
    <>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Riwayat Terakhir</Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.viewAll}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyList}>
        {historyData.length > 0 ? (
          historyData.map((item, index) => (
            <HistoryRow key={index} item={item} />
          ))
        ) : (
          <EmptyHistory />
        )}
      </View>
    </>
  );
}

function HistoryRow({ item }: { item: AttendanceHistoryItem }): React.JSX.Element {
  const isCheckIn = item.type === 'check_in';
  const iconName = isCheckIn ? 'arrow-down-circle' : 'arrow-up-circle';
  const iconColor = isCheckIn ? COLORS.SUCCESS : COLORS.PRIMARY;

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyIcon}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.historyContent}>
        <Text style={styles.historyType}>
          {isCheckIn ? 'Check In' : 'Check Out'}
        </Text>
        <Text style={styles.historyDate}>
          {new Date(item.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      </View>
      <Text style={styles.historyTime}>{formatTime(item.time)}</Text>
    </View>
  );
}

function EmptyHistory(): React.JSX.Element {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="document-text-outline" size={32} color={COLORS.BORDER} />
      <Text style={styles.emptyText}>
        Belum ada riwayat absensi yang terekam
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  viewAll: {
    fontSize: 13,
    fontFamily: FONT.MEDIUM,
    color: COLORS.PRIMARY,
  },
  historyList: {
    gap: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  historyIcon: {
    marginRight: 15,
  },
  historyContent: {
    flex: 1,
  },
  historyType: {
    fontSize: 14,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  historyDate: {
    fontSize: 11,
    fontFamily: FONT.REGULAR,
    color: COLORS.TEXT_SUB,
  },
  historyTime: {
    fontSize: 15,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.TEXT_SUB,
    textAlign: 'center',
  },
});