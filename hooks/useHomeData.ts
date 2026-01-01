import { attendanceService } from '@/services/attendanceService';
import { getUserFaceVector } from '@/services/faceVectorService';
import { masterControlService } from '@/services/masterControlService';
import { authStore } from '@/store/authStore';
import { OvertimeData, ShiftData, TodayAttendance } from '@/types/home';
import { isSameDay } from '@/utils/dateHelper';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

interface UseHomeDataReturn {
  user: any;
  refreshing: boolean;
  todayAttendance: TodayAttendance;
  recentHistory: any[];
  todayShift: ShiftData | null;
  overtimeData: OvertimeData | null;
  showFaceRegisterModal: boolean;
  setShowFaceRegisterModal: (show: boolean) => void;
  loadAttendanceData: () => Promise<void>;
}

export function useHomeData(): UseHomeDataReturn {
  const [user, setUser] = useState(authStore.getState().user);
  const [refreshing, setRefreshing] = useState(false);
  const [showFaceRegisterModal, setShowFaceRegisterModal] = useState(false);

  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({
    hasCheckedIn: false,
    hasCheckedOut: false,
    checkInTime: null,
    checkOutTime: null,
  });

  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [todayShift, setTodayShift] = useState<ShiftData | null>(null);
  const [overtimeData, setOvertimeData] = useState<OvertimeData | null>(null);

  const loadAttendanceData = useCallback(async (): Promise<void> => {
    const authState = authStore.getState();
    if (!authState.token || !authState.user?.id) return;

    try {
      const [
        todayResponse,
        historyData,
        shiftData,
        overtimeResponse,
        faceVektorRes,
      ] = await Promise.all([
        attendanceService.getTodayAttendance(authState.token, authState.user.id),
        attendanceService.getAttendanceHistory(authState.token, authState.user.id, 5),
        masterControlService.getTodayShift(authState.token || ''),
        attendanceService.getOvertimeData(authState.token),
        getUserFaceVector(),
      ]);

      // ========== DEBUG: CEK DATA MENTAH DARI API ==========
      console.log('=== RAW API DATA ===');
      console.log('Shift Data:', JSON.stringify(shiftData, null, 2));
      console.log('Today Attendance:', JSON.stringify(todayResponse.data, null, 2));
      console.log('Overtime Data:', JSON.stringify(overtimeResponse.data, null, 2));
      console.log('====================');
      // ====================================================

      if (faceVektorRes?.success === false) {
        setShowFaceRegisterModal(true);
      }

      if (todayResponse.data) {
        setTodayAttendance(todayResponse.data);
      }

      setRecentHistory(historyData || []);
      setTodayShift(shiftData);

      if (overtimeResponse.success && overtimeResponse.data?.length > 0) {
        const today = new Date();
        const validOvertime = overtimeResponse.data.find((item: any) => {
          const status = (item.status || '').toLowerCase();
          if (status.includes('reject') || status.includes('cancel')) return false;
          return isSameDay(today, new Date(item.start_time));
        });
        setOvertimeData(validOvertime || null);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAttendanceData();
    }, [loadAttendanceData])
  );

  return {
    user,
    refreshing,
    todayAttendance,
    recentHistory,
    todayShift,
    overtimeData,
    showFaceRegisterModal,
    setShowFaceRegisterModal,
    loadAttendanceData,
  };
}