import { KETERANGAN_THEMES } from '../constants/absensi.constants';
import { ATTENDANCE_COLORS, WEEKEND_DAYS } from '../constants/calendar';
import type { KeteranganTheme } from '../types/absensi';
import type { AttendanceByDate, AttendanceRecord, MarkedDatesType } from '../types/calendar';

// ==================== EXISTING TIME FORMATTERS ====================

/**
 * Format time dari ISO string dengan konversi UTC ke WIB (+7 jam)
 * Input: "2026-01-01T00:30:00.000000Z" (UTC)
 * Output: "07:30" (WIB)
 */
export const formatTime = (timeString: string | null): string => {
  if (!timeString) return '--:--';
  
  try {
    // Jika format ISO dengan Z (UTC), konversi ke WIB
    if (timeString.includes('T') && (timeString.includes('Z') || timeString.includes('+'))) {
      const date = new Date(timeString);
      
      // Ambil jam dan menit dalam timezone lokal (otomatis +7 untuk WIB)
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    }
    
    // Jika format time saja (HH:mm:ss)
    const [hours, minutes] = timeString.split(':');
    if (hours && minutes) {
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
  } catch (error) {
    console.error('Error formatting time:', error);
  }
  
  return '--:--';
};

/**
 * Format date kecil dengan konversi timezone
 * Input: "2025-12-30T09:30:00.000000Z"
 * Output: "30 Des"
 */
export const formatDateSmall = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${day} ${month}`;
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  return '';
};

/**
 * Format tanggal lengkap untuk hari ini
 * Output: "Rabu, 1 Jan"
 */
export const formatCurrentDateShort = (): string => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const now = new Date();
  const dayName = days[now.getDay()];
  const date = now.getDate();
  const monthName = months[now.getMonth()];
  
  return `${dayName}, ${date} ${monthName}`;
};

/**
 * Cek apakah 2 tanggal sama (dengan timezone lokal)
 */
export const isSameDay = (dateA: Date, dateB: Date): boolean => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
};

/**
 * Parse ISO string ke local time (WIB)
 * Untuk debug saja
 */
export const parseToLocalTime = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (error) {
    return '';
  }
};

// ==================== CALENDAR UTILITIES ====================

/**
 * Format date ke string YYYY-MM-DD
 * Input: Date object
 * Output: "2026-01-01"
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Menandai akhir pekan (Sabtu & Minggu) dalam calendar
 * @param year Tahun
 * @param month Bulan (1-12)
 * @returns Object dengan tanggal weekend yang sudah di-mark
 */
export const getWeekendMarking = (year: number, month: number): MarkedDatesType => {
  const weekendData: MarkedDatesType = {};
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const day = new Date(dateStr).getDay();
    
    if (day === WEEKEND_DAYS.SUNDAY || day === WEEKEND_DAYS.SATURDAY) {
      weekendData[dateStr] = {
        selected: true,
        selectedColor: ATTENDANCE_COLORS.WEEKEND_BG,
        textColor: ATTENDANCE_COLORS.WEEKEND_TEXT,
      };
    }
  }
  return weekendData;
};

/**
 * Mengelompokkan attendance records berdasarkan tanggal
 * @param records Array attendance records
 * @returns Object dengan key tanggal dan value checkIn/checkOut
 */
export const groupAttendanceByDate = (records: AttendanceRecord[]): Record<string, AttendanceByDate> => {
  const attendanceByDate: Record<string, AttendanceByDate> = {};
  
  records.forEach((record) => {
    const dateStr = record.date.split('T')[0];
    
    if (!attendanceByDate[dateStr]) {
      attendanceByDate[dateStr] = {};
    }
    
    const isCheckIn = record.status?.toLowerCase().includes('check in') || record.type === 'check_in';
    const isCheckOut = record.status?.toLowerCase().includes('check out') || record.type === 'check_out';
    
    if (isCheckIn) {
      attendanceByDate[dateStr].checkIn = record;
    }
    if (isCheckOut) {
      attendanceByDate[dateStr].checkOut = record;
    }
  });
  
  return attendanceByDate;
};

/**
 * Membuat marking untuk calendar berdasarkan attendance
 * @param attendanceByDate Attendance yang sudah dikelompokkan per tanggal
 * @returns Marked dates untuk react-native-calendars
 */
export const createAttendanceMarking = (attendanceByDate: Record<string, AttendanceByDate>): MarkedDatesType => {
  const attendanceMarking: MarkedDatesType = {};
  
  Object.entries(attendanceByDate).forEach(([dateStr, { checkIn, checkOut }]) => {
    if (checkIn && checkOut) {
      attendanceMarking[dateStr] = {
        selected: true,
        selectedColor: ATTENDANCE_COLORS.COMPLETE,
        customLabel: 'Check-in & Check-out',
        disableTouchEvent: false,
      };
    } else if (checkIn) {
      attendanceMarking[dateStr] = {
        selected: true,
        selectedColor: ATTENDANCE_COLORS.CHECK_IN_ONLY,
        customLabel: 'Check-in saja',
        disableTouchEvent: false,
      };
    }
  });
  
  return attendanceMarking;
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return formatDateString(new Date());
};

/**
 * Check if date is weekend
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === WEEKEND_DAYS.SUNDAY || day === WEEKEND_DAYS.SATURDAY;
};

/**
 * Get month name in Indonesian
 */
export const getMonthName = (month: number): string => {
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return months[month] || '';
};

/**
 * Get day name in Indonesian
 */
export const getDayName = (day: number): string => {
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  return days[day] || '';
};

/**
 * Format tanggal menjadi format Indonesia lengkap
 * @param dateStr - Date string in ISO format (optional, defaults to today)
 * @returns Formatted date string (e.g., "Rabu, 1 Januari 2026")
 */
export const formatDateFull = (dateStr?: string): string => {
  // Jika tidak ada parameter, gunakan tanggal hari ini
  const date = dateStr ? new Date(dateStr.split('T')[0]) : new Date();
  
  if (isNaN(date.getTime())) return dateStr || '-';
  
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format waktu menjadi format WIB
 * @param timeStr - Time string or ISO string
 * @returns Formatted time string (e.g., "08:00 WIB")
 */
export const formatTimeWIB = (timeStr?: string): string => {
  if (!timeStr) return '-';
  
  // Jika format HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes} WIB`;
  }
  
  // Jika format ISO date
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes} WIB`;
};

/**
 * Mendapatkan theme berdasarkan keterangan
 * @param keterangan - Status keterangan
 * @returns Theme object
 */
export const getKeteranganTheme = (keterangan: string): KeteranganTheme => {
  const normalized = keterangan?.toLowerCase() || '';
  
  if (normalized.includes('telat')) {
    return KETERANGAN_THEMES.TELAT;
  }
  
  if (normalized.includes('tepat waktu') || normalized.includes('present')) {
    return KETERANGAN_THEMES.TEPAT_WAKTU;
  }
  
  if (normalized.includes('lebih awal')) {
    return KETERANGAN_THEMES.LEBIH_AWAL;
  }
  
  return KETERANGAN_THEMES.DEFAULT;
};

/**
 * Cek apakah tipe absensi adalah check in
 * @param status - Status absensi
 * @returns Boolean
 */
export const isCheckInType = (status: string): boolean => {
  return status === 'check_in' || status?.toLowerCase().includes('in');
};

/**
 * Mendapatkan text label untuk tipe absensi
 * @param status - Status absensi
 * @returns Label text
 */
export const getAbsensiTypeLabel = (status: string): string => {
  if (isCheckInType(status)) return 'Check In';
  if (status === 'check_out') return 'Check Out';
  return status || 'Absensi';
};

/**
 * Format tanggal dan waktu lengkap dari ISO string dengan GMT+7 (WIB)
 * @param isoString - ISO datetime string
 * @returns Object dengan dateDisplay, timeDisplay, dan dayName
 */
export const formatFullDateTime = (isoString: string): {
  dateDisplay: string;
  timeDisplay: string;
  dayName: string;
} => {
  if (!isoString) {
    return {
      dateDisplay: '-',
      timeDisplay: '--:--',
      dayName: '-',
    };
  }

  try {
    // Parse ISO string ke Date object (otomatis konversi ke local timezone)
    const date = new Date(isoString);
    
    console.log('🕐 [formatFullDateTime] Input:', isoString);
    console.log('🕐 [formatFullDateTime] Parsed (WIB):', date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
    
    // Format date
    const dateDisplay = date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
    
    // Format day name
    const dayName = date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      timeZone: 'Asia/Jakarta'
    });
    
    // Format time (GMT+7)
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeDisplay = `${hours}:${minutes}`;
    
    console.log('🕐 [formatFullDateTime] Output:', { dateDisplay, timeDisplay, dayName });
    
    return {
      dateDisplay,
      timeDisplay,
      dayName,
    };
  } catch (error) {
    console.error('❌ [formatFullDateTime] Error:', error);
    return {
      dateDisplay: '-',
      timeDisplay: '--:--',
      dayName: '-',
    };
  }
};

/**
 * Calculate duration in hours from minutes
 * @param minutes - Total minutes
 * @returns Formatted hours string
 */
export const formatDurationHours = (minutes: number): string => {
  const hours = Math.round(minutes / 60);
  return `${hours} Jam`;
};