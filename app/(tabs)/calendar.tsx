import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { attendanceService } from '../../services/attendanceService';
import { authStore } from '../../store/authStore';

// Konfigurasi Bahasa Indonesia
LocaleConfig.locales['id'] = {
  monthNames: ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
  dayNames: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  dayNamesShort: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'],
  today: 'Hari ini'
};
LocaleConfig.defaultLocale = 'id';

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Fungsi untuk menandai Sabtu & Minggu sebagai tanggal merah
  const getWeekendMarking = (year: number, month: number) => {
    const weekendData: any = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const day = new Date(dateStr).getDay();
      
      if (day === 0 || day === 6) { // 0 = Minggu, 6 = Sabtu
        weekendData[dateStr] = {
          selected: true,
          selectedColor: '#FEE2E2', // Merah muda lembut
          textColor: '#EF4444',     // Teks merah
        };
      }
    }
    return weekendData;
  };

  const fetchAttendance = useCallback(async () => {
    setRefreshing(true);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const weekends = getWeekendMarking(year, month);

    const { user, token } = authStore.getState();
    if (!user || !token) {
      setMarkedDates(weekends);
      setRefreshing(false);
      return;
    }

    const attendanceRecords = await attendanceService.getAttendanceHistory(token, user.id, 40);
    // Gabungkan absensi per tanggal
    const attendanceByDate: Record<string, { checkIn?: any; checkOut?: any }> = {};
    attendanceRecords.forEach((record) => {
      // Format tanggal yyyy-mm-dd
      const dateStr = record.date.split('T')[0];
      if (!attendanceByDate[dateStr]) attendanceByDate[dateStr] = {};
      if (record.status?.toLowerCase().includes('check in') || record.type === 'check_in') {
        attendanceByDate[dateStr].checkIn = record;
      }
      if (record.status?.toLowerCase().includes('check out') || record.type === 'check_out') {
        attendanceByDate[dateStr].checkOut = record;
      }
    });

    const attendanceMarking: any = {};
    Object.keys(attendanceByDate).forEach((dateStr) => {
      const { checkIn, checkOut } = attendanceByDate[dateStr];
      if (checkIn && checkOut) {
        attendanceMarking[dateStr] = {
          selected: true,
          selectedColor: '#10B981',
          customLabel: 'Check-in & Check-out',
          disableTouchEvent: false,
        };
      } else if (checkIn && !checkOut) {
        attendanceMarking[dateStr] = {
          selected: true,
          selectedColor: '#F59E0B',
          customLabel: 'Check-in saja',
          disableTouchEvent: false,
        };
      }
    });

    setMarkedDates({ ...weekends, ...attendanceMarking });
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchAttendance} colors={["#2b5597"]} />
      }
    >
      <Text style={styles.title}>Kalender Absensi</Text>
      <View style={styles.calendarWrapper}>
        <Calendar
          current={new Date().toISOString().split('T')[0]}
          markedDates={markedDates}
          theme={{
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            todayTextColor: '#2b5597',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            monthTextColor: '#2b5597',
            textDayFontFamily: 'Fredoka-Regular',
            textMonthFontFamily: 'Fredoka-Bold',
            textDayHeaderFontFamily: 'Fredoka-Medium',
          }}
        />
      </View>
      {/* Legend / Keterangan */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Keterangan Status:</Text>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <View>
            <Text style={styles.legendText}>Hadir (Check-in & Check-out)</Text>
            <Text style={styles.subLegendText}>Absensi hari ini lengkap</Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <View>
            <Text style={styles.legendText}>Hanya Check-in</Text>
            <Text style={styles.subLegendText}>Belum melakukan absensi keluar</Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Libur Akhir Pekan</Text>
        </View>
      </View>
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
    color: '#2b5597',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Fredoka-Bold',
    marginTop: 40,
  },
  calendarWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  legendTitle: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Fredoka-Bold',
    color: '#374151',
  },
  subLegendText: {
    fontSize: 12,
    fontFamily: 'Fredoka-Regular',
    color: '#6B7280',
  },
});