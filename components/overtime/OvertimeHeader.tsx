import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT } from '../../constants/absensi.constants';
import { OVERTIME_COLORS } from '../../constants/overtime';

interface OvertimeHeaderProps {
  title?: string;
  subtitle?: string;
}

export const OvertimeHeader: React.FC<OvertimeHeaderProps> = ({
  title = 'Jadwal Lembur',
  subtitle = 'Pantau riwayat lembur lintas tanggal',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: OVERTIME_COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontFamily: FONT.BOLD,
    color: OVERTIME_COLORS.TEXT_MAIN,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONT.REGULAR,
    color: OVERTIME_COLORS.TEXT_SUB,
    marginTop: 2,
  },
});