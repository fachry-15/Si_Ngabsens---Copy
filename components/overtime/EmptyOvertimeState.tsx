import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../../constants/absensi.constants';
import { OVERTIME_COLORS } from '../../constants/overtime';

interface EmptyOvertimeStateProps {
  message?: string;
}

export const EmptyOvertimeState: React.FC<EmptyOvertimeStateProps> = ({
  message = 'Belum ada pengajuan lembur',
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="clipboard-outline" size={40} color={OVERTIME_COLORS.TEXT_SUB} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
  },
  text: {
    fontSize: 14,
    fontFamily: FONT.REGULAR,
    color: OVERTIME_COLORS.TEXT_SUB,
  },
});