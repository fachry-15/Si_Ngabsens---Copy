import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AttendanceCard } from '@/components/home/AttendanceCard';
import { AttendanceHistory } from '@/components/home/AttendanceHistory';
import { HomeHeader } from '@/components/home/HomeHeader';
import { OvertimeCard } from '@/components/home/OvertimeCard';
import { ShiftCard } from '@/components/home/ShiftCard';
import { COLORS } from '@/constants/home';
import { useHomeData } from '@/hooks/useHomeData';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    user,
    refreshing,
    todayAttendance,
    recentHistory,
    todayShift,
    overtimeData,
    loadAttendanceData,
  } = useHomeData();

  const handleRefresh = (): void => {
    loadAttendanceData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BG} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <HomeHeader
          userName={user?.name || 'Karyawan'}
          onProfilePress={() => router.push('/(tabs)/profile')}
        />

        <ShiftCard shiftData={todayShift} />

        {overtimeData && <OvertimeCard overtimeData={overtimeData} />}

        <AttendanceCard
          todayAttendance={todayAttendance}
          onCheckInPress={() => router.push('/check-in?status=checkin')}
          onCheckOutPress={() => router.push('/check-in?status=checkout')}
        />

        <AttendanceHistory
          historyData={recentHistory}
          onViewAllPress={() => router.push('/history')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
});