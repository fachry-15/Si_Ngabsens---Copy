import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../../constants/absensi.constants';
import { OVERTIME_COLORS } from '../../constants/overtime';

interface OvertimeFooterProps {
  totalMinutes: number;
}

export const OvertimeFooter: React.FC<OvertimeFooterProps> = ({ totalMinutes }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="information-circle-outline" size={14} color={OVERTIME_COLORS.ACCENT} />
      <Text style={styles.text}>Total akumulasi lembur: {totalMinutes} menit</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  text: {
    fontSize: 11,
    fontFamily: FONT.MEDIUM,
    color: OVERTIME_COLORS.ACCENT,
  },
});