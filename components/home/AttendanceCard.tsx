import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT } from '@/constants/home';
import { TodayAttendance } from '@/types/home';
import { formatTime } from '@/utils/dateHelper';

interface AttendanceCardProps {
  todayAttendance: TodayAttendance;
  onCheckInPress: () => void;
  onCheckOutPress: () => void;
}

export function AttendanceCard({
  todayAttendance,
  onCheckInPress,
  onCheckOutPress,
}: AttendanceCardProps): React.JSX.Element {
  const { hasCheckedIn, hasCheckedOut, checkInTime, checkOutTime } = todayAttendance;

  const getButtonText = (): string => {
    if (hasCheckedOut) return 'Sudah Selesai';
    if (!hasCheckedIn) return 'Check In Sekarang';
    return 'Check Out Sekarang';
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (!hasCheckedIn) return 'scan-outline';
    return 'log-out-outline';
  };

  const handlePress = (): void => {
    if (!hasCheckedIn) {
      onCheckInPress();
    } else {
      onCheckOutPress();
    }
  };

  return (
    <View style={styles.attendanceMainCard}>
      <View style={styles.cardInfoRow}>
        <Text style={styles.cardHeading}>STATUS KEHADIRAN</Text>
        <View
          style={[
            styles.dotStatus,
            { backgroundColor: hasCheckedIn ? COLORS.SUCCESS : COLORS.WARNING },
          ]}
        />
      </View>
      <View style={styles.mainTimeRow}>
        <View style={styles.mainTimeItem}>
          <Text style={styles.timeVal}>{formatTime(checkInTime)}</Text>
          <Text style={styles.timeLab}>Masuk</Text>
        </View>
        <View style={styles.mainTimeItem}>
          <Text style={styles.timeVal}>{formatTime(checkOutTime)}</Text>
          <Text style={styles.timeLab}>Pulang</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.btnPrimary, hasCheckedOut && styles.btnDisabled]}
        onPress={handlePress}
        disabled={hasCheckedOut}
        activeOpacity={0.8}
      >
        <Ionicons name={getIconName()} size={20} color={COLORS.WHITE} />
        <Text style={styles.btnTextPrimary}>{getButtonText()}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  attendanceMainCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 30,
    padding: 24,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginBottom: 25,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeading: {
    fontSize: 11,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_SUB,
    letterSpacing: 1,
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mainTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  mainTimeItem: {
    alignItems: 'center',
  },
  timeVal: {
    fontSize: 32,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  timeLab: {
    fontSize: 12,
    fontFamily: FONT.MEDIUM,
    color: COLORS.TEXT_SUB,
  },
  btnPrimary: {
    backgroundColor: COLORS.PRIMARY,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnTextPrimary: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontFamily: FONT.BOLD,
  },
  btnDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.BG,
  },
});