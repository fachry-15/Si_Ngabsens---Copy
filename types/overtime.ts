export interface OvertimeRecord {
  id: number;
  start_time: string;
  end_time: string;
  total_minutes: number;
  reason?: string;
  status: string;
}

export interface OvertimeStatusConfig {
  bg: string;
  text: string;
  icon: string;
}

export interface FormattedDateTime {
  dateDisplay: string;
  timeDisplay: string;
  dayName: string;
}