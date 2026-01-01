export interface TodayAttendance {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export interface ShiftData {
  shift: {
    schedule: string;
    check_in_time: string;
    check_out_time: string;
  };
}

export interface OvertimeData {
  status: string;
  start_time: string;
  end_time: string;
  total_minutes: number;
}

export interface AttendanceHistoryItem {
  type: 'check_in' | 'check_out';
  date: string;
  time: string;
}