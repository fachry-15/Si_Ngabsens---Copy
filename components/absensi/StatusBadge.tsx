import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT } from '../../constants/absensi.constants';
import type { KeteranganTheme } from '../../types/absensi';

interface StatusBadgeProps {
  keterangan: string;
  theme: KeteranganTheme;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ keterangan, theme }) => {
  if (!keterangan) return null;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.textColor }]}>
        {keterangan}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: FONT.BOLD,
  },
});