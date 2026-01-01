import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../../constants/absensi.constants';
import { OVERTIME_COLORS } from '../../constants/overtime';

interface OvertimeReasonBoxProps {
  reason?: string;
}

export const OvertimeReasonBox: React.FC<OvertimeReasonBoxProps> = ({ reason }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="document-text-outline" size={14} color={OVERTIME_COLORS.TEXT_SUB} />
      <Text style={styles.text} numberOfLines={2}>
        {reason || 'Tidak ada alasan'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.REGULAR,
    color: '#475569',
    fontStyle: 'italic',
  },
});