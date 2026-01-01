import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ATTENDANCE_COLORS } from '../../constants/calendar';
import type { MarkedDatesType } from '../../types/calendar';

interface AttendanceCalendarProps {
  markedDates: MarkedDatesType;
  currentDate?: string;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  markedDates,
  currentDate = new Date().toISOString().split('T')[0],
}) => {
  return (
    <View style={styles.container}>
      <Calendar
        current={currentDate}
        markedDates={markedDates}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          todayTextColor: ATTENDANCE_COLORS.PRIMARY,
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          monthTextColor: ATTENDANCE_COLORS.PRIMARY,
          textDayFontFamily: 'Fredoka-Regular',
          textMonthFontFamily: 'Fredoka-Bold',
          textDayHeaderFontFamily: 'Fredoka-Medium',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});