import { attendanceService } from '@/services/attendanceService';
import { faceService } from '@/services/faceVectorService';
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
        faceService.getUserFaceVector(),
      ]);

      // ========== DEBUG: CEK DATA MENTAH DARI API ==========
      console.log('=== RAW API DATA ===');
      console.log('Shift Data:', JSON.stringify(shiftData, null, 2));
      console.log('Today Attendance:', JSON.stringify(todayResponse.data, null, 2));
      console.log('Overtime Data:', JSON.stringify(overtimeResponse.data, null, 2));
      console.log('Face Vector Response:', JSON.stringify(faceVektorRes, null, 2));
      console.log('====================');
      // ====================================================

      console.log('🔍 Checking face vector:', faceVektorRes?.success);
      if (faceVektorRes?.success === false) {
        console.log('⚠️ User belum daftar wajah, show modal!');
        setShowFaceRegisterModal(true);
      } else {
        console.log('✅ User sudah daftar wajah');
      }

      if (todayResponse.data) {
        setTodayAttendance(todayResponse.data);
      }

      setRecentHistory(historyData || []);
      setTodayShift(shiftData);

      if (overtimeResponse.success && overtimeResponse.data?.length > 0) {
        console.log('⏰ [Overtime] Processing overtime data...');
        console.log('⏰ [Overtime] Total overtimes:', overtimeResponse.data.length);
        
        const today = new Date();
        console.log('📅 [Overtime] Today (local):', today.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
        console.log('📅 [Overtime] Today ISO:', today.toISOString());
        
        overtimeResponse.data.forEach((item: any, index: number) => {
          console.log(`\n🔍 [Overtime ${index + 1}]:`);
          console.log('  start_time (raw):', item.start_time);
          console.log('  start_time (parsed):', new Date(item.start_time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
          console.log('  end_time (raw):', item.end_time);
          console.log('  end_time (parsed):', new Date(item.end_time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
          console.log('  status:', item.status);
          console.log('  isSameDay:', isSameDay(today, new Date(item.start_time)));
        });
        
        const validOvertime = overtimeResponse.data.find((item: any) => {
          const status = (item.status || '').toLowerCase();
          if (status.includes('reject') || status.includes('cancel')) {
            console.log('❌ [Overtime] Skipped (rejected/cancelled):', item.status);
            return false;
          }
          const isToday = isSameDay(today, new Date(item.start_time));
          console.log('✅ [Overtime] Is today?', isToday, 'Status:', item.status);
          return isToday;
        });
        
        console.log('\n🎯 [Overtime] Valid overtime for today:', validOvertime ? 'Found' : 'Not found');
        if (validOvertime) {
          console.log('  Selected overtime:', JSON.stringify(validOvertime, null, 2));
        }
        
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