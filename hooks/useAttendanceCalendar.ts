import { useCallback, useEffect, useState } from 'react';
import { attendanceService } from '../services/attendanceService';
import { authStore } from '../store/authStore';
import type { MarkedDatesType } from '../types/calendar';
import { createAttendanceMarking, getWeekendMarking, groupAttendanceByDate } from '../utils/dateHelper';

export const useAttendanceCalendar = () => {
  const [markedDates, setMarkedDates] = useState<MarkedDatesType>({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const weekends = getWeekendMarking(year, month);

      const { user, token } = authStore.getState();
      
      if (!user || !token) {
        setMarkedDates(weekends);
        return;
      }

      const attendanceRecords = await attendanceService.getAttendanceHistory(token, user.id, 40);
      const attendanceByDate = groupAttendanceByDate(attendanceRecords);
      const attendanceMarking = createAttendanceMarking(attendanceByDate);

      setMarkedDates({ ...weekends, ...attendanceMarking });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      console.error('Error fetching attendance:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    markedDates,
    refreshing,
    error,
    fetchAttendance,
  };
};