export interface AttendanceRecord {
  id: string;
  date: string;
  status?: string;
  type?: 'check_in' | 'check_out';
  time?: string;
}

export interface MarkedDate {
  selected: boolean;
  selectedColor: string;
  textColor?: string;
  customLabel?: string;
  disableTouchEvent?: boolean;
}

export interface AttendanceByDate {
  checkIn?: AttendanceRecord;
  checkOut?: AttendanceRecord;
}

export type MarkedDatesType = Record<string, MarkedDate>;