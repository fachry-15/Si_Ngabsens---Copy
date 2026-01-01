import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT } from '../../constants/absensi.constants';
import { OVERTIME_COLORS } from '../../constants/overtime';
import { formatFullDateTime, formatDurationHours } from '../../utils/dateHelper';
import type { FormattedDateTime } from '../../types/overtime';

interface OvertimeDateTimeSectionProps {
  startTime: string;
  endTime: string;
  totalMinutes: number;
}

interface DateTimeBoxProps {
  label: string;
  data: FormattedDateTime;
  alignRight?: boolean;
}

const DateTimeBox: React.FC<DateTimeBoxProps> = ({ label, data, alignRight = false }) => (
  <View style={[styles.dateTimeBox, alignRight && { alignItems: 'flex-end' }]}>
    <Text style={[styles.dtLabel, alignRight && { textAlign: 'right' }]}>{label}</Text>
    <Text style={[styles.dtTime, alignRight && { textAlign: 'right' }]}>{data.timeDisplay}</Text>
    <Text style={[styles.dtDate, alignRight && { textAlign: 'right' }]}>{data.dateDisplay}</Text>
    <Text style={[styles.dtDay, alignRight && { textAlign: 'right' }]}>{data.dayName}</Text>
  </View>
);

export const OvertimeDateTimeSection: React.FC<OvertimeDateTimeSectionProps> = ({
  startTime,
  endTime,
  totalMinutes,
}) => {
  const start = formatFullDateTime(startTime);
  const end = formatFullDateTime(endTime);
  const duration = formatDurationHours(totalMinutes);

  return (
    <View style={styles.container}>
      <DateTimeBox label="Mulai" data={start} />

      <View style={styles.arrowConnector}>
        <View style={styles.line} />
        <View style={styles.durationChip}>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
        <View style={styles.line} />
      </View>

      <DateTimeBox label="Selesai" data={end} alignRight />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: OVERTIME_COLORS.SECTION_BG,
    borderRadius: 16,
    padding: 15,
  },
  dateTimeBox: {
    flex: 2,
  },
  dtLabel: {
    fontSize: 10,
    fontFamily: FONT.MEDIUM,
    color: OVERTIME_COLORS.TEXT_SUB,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dtTime: {
    fontSize: 22,
    fontFamily: FONT.BOLD,
    color: OVERTIME_COLORS.TEXT_MAIN,
  },
  dtDate: {
    fontSize: 12,
    fontFamily: FONT.SEMIBOLD,
    color: OVERTIME_COLORS.TEXT_MAIN,
    marginTop: 2,
  },
  dtDay: {
    fontSize: 11,
    fontFamily: FONT.REGULAR,
    color: OVERTIME_COLORS.TEXT_SUB,
  },
  arrowConnector: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  line: {
    width: 1,
    height: 15,
    backgroundColor: '#CBD5E1',
  },
  durationChip: {
    backgroundColor: OVERTIME_COLORS.WHITE,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  durationText: {
    fontSize: 9,
    fontFamily: FONT.BOLD,
    color: OVERTIME_COLORS.PRIMARY,
  },
});