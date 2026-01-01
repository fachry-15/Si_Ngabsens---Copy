import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, COLORS } from '../../constants/absensi.constants';
import { StatusBadge } from './StatusBadge';
import type { KeteranganTheme } from '../../types/absensi';

interface AbsensiMainCardProps {
  typeText: string;
  dateFormatted: string;
  timeFormatted: string;
  keterangan: string;
  theme: KeteranganTheme;
  isCheckIn: boolean;
}

export const AbsensiMainCard: React.FC<AbsensiMainCardProps> = ({
  typeText,
  dateFormatted,
  timeFormatted,
  keterangan,
  theme,
  isCheckIn,
}) => {
  const iconColor = isCheckIn ? COLORS.SUCCESS : COLORS.PRIMARY;
  const iconName = isCheckIn ? 'log-in-outline' : 'log-out-outline';
  
  return (
    <View style={styles.container}>
      <View style={styles.typeRow}>
        <View style={[styles.typeIconCircle, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName} size={28} color={COLORS.WHITE} />
        </View>
        
        <View style={styles.typeInfo}>
          <Text style={styles.typeLabel}>{typeText}</Text>
          <Text style={styles.typeDateTime}>{dateFormatted}</Text>
        </View>
        
        <StatusBadge keterangan={keterangan} theme={theme} />
      </View>

      <View style={styles.timeSection}>
        <Text style={styles.timeValue}>{timeFormatted}</Text>
        <Ionicons name="alarm-outline" size={40} color="#E0E7FF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
    gap: 12,
  },
  typeIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    fontFamily: FONT.MEDIUM,
  },
  typeDateTime: {
    fontSize: 16,
    color: COLORS.GRAY_900,
    fontFamily: FONT.SEMIBOLD,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 38,
    fontFamily: FONT.BOLD,
    color: COLORS.PRIMARY,
  },
});