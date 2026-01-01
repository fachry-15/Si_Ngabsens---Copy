import { LocaleConfig } from 'react-native-calendars';

export const ATTENDANCE_COLORS = {
  COMPLETE: '#10B981',
  CHECK_IN_ONLY: '#F59E0B',
  WEEKEND_BG: '#FEE2E2',
  WEEKEND_TEXT: '#EF4444',
  PRIMARY: '#2b5597',
} as const;

export const WEEKEND_DAYS = {
  SUNDAY: 0,
  SATURDAY: 6,
} as const;

// Konfigurasi Bahasa Indonesia
LocaleConfig.locales['id'] = {
  monthNames: ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
  dayNames: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  dayNamesShort: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'],
  today: 'Hari ini'
};
LocaleConfig.defaultLocale = 'id';