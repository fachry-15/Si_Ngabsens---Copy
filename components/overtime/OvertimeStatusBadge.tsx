import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../../constants/absensi.constants';
import { OVERTIME_STATUS_CONFIG } from '../../constants/overtime';
import type { OvertimeStatusConfig } from '../../types/overtime';

interface OvertimeStatusBadgeProps {
  status: string;
}

const getStatusConfig = (status: string): OvertimeStatusConfig => {
  const normalized = status?.toLowerCase() || '';
  
  if (normalized.includes('approve')) {
    return OVERTIME_STATUS_CONFIG.APPROVED;
  }
  if (normalized.includes('reject')) {
    return OVERTIME_STATUS_CONFIG.REJECTED;
  }
  return OVERTIME_STATUS_CONFIG.PENDING;
};

export const OvertimeStatusBadge: React.FC<OvertimeStatusBadgeProps> = ({ status }) => {
  const config = getStatusConfig(status);
  
  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon as any} size={12} color={config.text} />
      <Text style={[styles.text, { color: config.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  text: {
    fontSize: 10,
    fontFamily: FONT.BOLD,
    textTransform: 'uppercase',
  },
});