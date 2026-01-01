import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT } from '@/constants/home';
import { ShiftData } from '@/types/home';
import { formatDateFull, formatTime } from '@/utils/dateHelper';

interface ShiftCardProps {
  shiftData: ShiftData | null;
}

export function ShiftCard({ shiftData }: ShiftCardProps): React.JSX.Element {
  return (
    <View style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.badgePrimary}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.PRIMARY} />
          <Text style={styles.badgeTextPrimary}>JADWAL HARI INI</Text>
        </View>
        <Text style={styles.shiftDate}>{formatDateFull()}</Text>
      </View>
      <View style={styles.shiftBody}>
        <View style={styles.shiftItem}>
          <Text style={styles.labelSmall}>Shift</Text>
          <Text style={styles.valueMedium}>
            {shiftData?.shift?.schedule || 'N/A'}
          </Text>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.shiftItem}>
          <Text style={styles.labelSmall}>Jam Kerja</Text>
          <Text style={styles.valueMedium}>
            {shiftData
              ? `${formatTime(shiftData.shift.check_in_time)} - ${formatTime(shiftData.shift.check_out_time)}`
              : '--:--'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shiftCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  badgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.PRIMARY_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTextPrimary: {
    fontSize: 10,
    fontFamily: FONT.BOLD,
    color: COLORS.PRIMARY,
  },
  shiftDate: {
    fontSize: 11,
    fontFamily: FONT.MEDIUM,
    color: COLORS.TEXT_SUB,
  },
  shiftBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftItem: {
    flex: 1,
  },
  labelSmall: {
    fontSize: 10,
    fontFamily: FONT.MEDIUM,
    color: COLORS.TEXT_SUB,
    marginBottom: 2,
  },
  valueMedium: {
    fontSize: 15,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  vDivider: {
    width: 1,
    height: 25,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: 15,
  },
});