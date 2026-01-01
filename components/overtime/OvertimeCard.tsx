import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../../constants/absensi.constants';
import { OVERTIME_COLORS } from '../../constants/overtime';
import { OvertimeStatusBadge } from './OvertimeStatusBadge';
import { OvertimeDateTimeSection } from './OvertimeDateTimeSection';
import { OvertimeReasonBox } from './OvertimeReasonBox';
import { OvertimeFooter } from './OvertimeFooter';
import type { OvertimeRecord } from '../../types/overtime';

interface OvertimeCardProps {
  overtime: OvertimeRecord;
}

export const OvertimeCard: React.FC<OvertimeCardProps> = ({ overtime }) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.ovIconCircle}>
            <Ionicons name="moon" size={16} color={OVERTIME_COLORS.PRIMARY} />
          </View>
          <Text style={styles.ovLabel}>Detail Lembur</Text>
        </View>
        <OvertimeStatusBadge status={overtime.status} />
      </View>

      {/* Date & Time Section */}
      <OvertimeDateTimeSection
        startTime={overtime.start_time}
        endTime={overtime.end_time}
        totalMinutes={overtime.total_minutes}
      />

      {/* Reason */}
      <OvertimeReasonBox reason={overtime.reason} />

      {/* Footer */}
      <OvertimeFooter totalMinutes={overtime.total_minutes} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: OVERTIME_COLORS.WHITE,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: OVERTIME_COLORS.BORDER,
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ovIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: OVERTIME_COLORS.PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovLabel: {
    fontSize: 14,
    fontFamily: FONT.BOLD,
    color: OVERTIME_COLORS.TEXT_MAIN,
  },
});