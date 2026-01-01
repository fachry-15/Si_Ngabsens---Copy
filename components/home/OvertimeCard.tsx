import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '@/constants/home';
import { OvertimeData } from '@/types/home';
import { formatDateSmall, formatTime } from '@/utils/dateHelper';

interface OvertimeCardProps {
  overtimeData: OvertimeData;
}

export function OvertimeCard({ overtimeData }: OvertimeCardProps): React.JSX.Element {
  const totalHours = Math.round(overtimeData.total_minutes / 60);

  return (
    <View style={styles.overtimeCard}>
      <View style={styles.overtimeHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="moon" size={16} color={COLORS.ACCENT} />
          <Text style={styles.overtimeTitle}>Lembur Terjadwal</Text>
        </View>
        <View style={styles.badgeSuccess}>
          <Text style={styles.badgeTextSuccess}>
            {overtimeData.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.overtimeTimeRow}>
        <View style={styles.otTimeBox}>
          <Text style={styles.labelMicro}>
            {formatDateSmall(overtimeData.start_time)}
          </Text>
          <Text style={styles.valueSmall}>
            {formatTime(overtimeData.start_time)}
          </Text>
          <Text style={styles.labelMicro}>Mulai</Text>
        </View>
        <Ionicons name="arrow-forward" size={14} color={COLORS.TEXT_SUB} />
        <View style={styles.otTimeBox}>
          <Text style={styles.labelMicro}>
            {formatDateSmall(overtimeData.end_time)}
          </Text>
          <Text style={styles.valueSmall}>
            {formatTime(overtimeData.end_time)}
          </Text>
          <Text style={styles.labelMicro}>Selesai</Text>
        </View>
        <View style={styles.otDurationBadge}>
          <Text style={styles.otDurationText}>{totalHours} Jam</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overtimeCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D0E0FF',
  },
  overtimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overtimeTitle: {
    fontSize: 13,
    fontFamily: FONT.BOLD,
    color: COLORS.ACCENT,
  },
  badgeSuccess: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTextSuccess: {
    fontSize: 9,
    fontFamily: FONT.BOLD,
    color: COLORS.WHITE,
  },
  overtimeTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  otTimeBox: {
    alignItems: 'center',
  },
  valueSmall: {
    fontSize: 16,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  labelMicro: {
    fontSize: 9,
    fontFamily: FONT.REGULAR,
    color: COLORS.TEXT_SUB,
  },
  otDurationBadge: {
    marginLeft: 'auto',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0E0FF',
  },
  otDurationText: {
    fontSize: 11,
    fontFamily: FONT.BOLD,
    color: COLORS.ACCENT,
  },
});