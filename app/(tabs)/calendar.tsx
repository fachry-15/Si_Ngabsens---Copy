import React from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import { AttendanceCalendar } from '../../components/calendar/AttendanceCalendar';
import { CalendarLegend } from '../../components/calendar/CalendarLegend';
import '../../constants/calendar'; // Import untuk inisialisasi LocaleConfig
import { ATTENDANCE_COLORS } from '../../constants/calendar';
import { useAttendanceCalendar } from '../../hooks/useAttendanceCalendar';

export default function CalendarScreen() {
  const { markedDates, refreshing, error, fetchAttendance } = useAttendanceCalendar();

  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchAttendance}
          colors={[ATTENDANCE_COLORS.PRIMARY]}
        />
      }
    >
      <Text style={styles.title}>Kalender Absensi</Text>
      
      <AttendanceCalendar markedDates={markedDates} />
      
      <CalendarLegend />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 22,
    color: ATTENDANCE_COLORS.PRIMARY,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Fredoka-Bold',
    marginTop: 40,
  },
});