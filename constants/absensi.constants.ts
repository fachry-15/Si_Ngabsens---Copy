export const FONT = {
  REGULAR: 'Fredoka-Regular',
  MEDIUM: 'Fredoka-Medium',
  SEMIBOLD: 'Fredoka-SemiBold',
  BOLD: 'Fredoka-Bold',
} as const;

export const COLORS = {
  PRIMARY: '#2b5597',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  BACKGROUND: '#F5F7FA',
  WHITE: '#FFFFFF',
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_900: '#1F2937',
} as const;

export const KETERANGAN_THEMES = {
  TELAT: {
    color: COLORS.DANGER,
    background: '#FEE2E2',
    textColor: COLORS.DANGER,
  },
  TEPAT_WAKTU: {
    color: COLORS.SUCCESS,
    background: '#D1FAE5',
    textColor: COLORS.SUCCESS,
  },
  LEBIH_AWAL: {
    color: COLORS.WARNING,
    background: '#FEF3C7',
    textColor: COLORS.WARNING,
  },
  DEFAULT: {
    color: COLORS.PRIMARY,
    background: '#E0E7FF',
    textColor: COLORS.PRIMARY,
  },
} as const;