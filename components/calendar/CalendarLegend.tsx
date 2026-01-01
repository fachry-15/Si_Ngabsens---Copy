import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ATTENDANCE_COLORS } from '../../constants/calendar';

interface LegendItemProps {
  color: string;
  title: string;
  subtitle?: string;
  hasBorder?: boolean;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, title, subtitle, hasBorder }) => (
  <View style={styles.legendItem}>
    <View
      style={[
        styles.dot,
        { backgroundColor: color },
        hasBorder && { borderWidth: 1, borderColor: ATTENDANCE_COLORS.WEEKEND_TEXT }
      ]}
    />
    <View>
      <Text style={styles.legendText}>{title}</Text>
      {subtitle && <Text style={styles.subLegendText}>{subtitle}</Text>}
    </View>
  </View>
);

export const CalendarLegend: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keterangan Status:</Text>
      
      <LegendItem
        color={ATTENDANCE_COLORS.COMPLETE}
        title="Hadir (Check-in & Check-out)"
        subtitle="Absensi hari ini lengkap"
      />
      
      <LegendItem
        color={ATTENDANCE_COLORS.CHECK_IN_ONLY}
        title="Hanya Check-in"
        subtitle="Belum melakukan absensi keluar"
      />
      
      <LegendItem
        color={ATTENDANCE_COLORS.WEEKEND_BG}
        title="Libur Akhir Pekan"
        hasBorder
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  title: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Fredoka-Bold',
    color: '#374151',
  },
  subLegendText: {
    fontSize: 12,
    fontFamily: 'Fredoka-Regular',
    color: '#6B7280',
  },
});