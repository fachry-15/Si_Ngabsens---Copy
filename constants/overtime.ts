export const OVERTIME_COLORS = {
  PRIMARY: '#2b5597',
  PRIMARY_LIGHT: '#EEF2FF',
  ACCENT: '#6366F1',
  TEXT_MAIN: '#111827',
  TEXT_SUB: '#6B7280',
  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#D1FAE5',
  WARNING: '#F59E0B',
  WARNING_LIGHT: '#FEF3C7',
  DANGER: '#EF4444',
  DANGER_LIGHT: '#FEE2E2',
  BG: '#F9FAFB',
  WHITE: '#FFFFFF',
  BORDER: '#E5E7EB',
  SECTION_BG: '#F8FAFC',
} as const;

export const OVERTIME_STATUS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING: 'pending',
} as const;

export const OVERTIME_STATUS_CONFIG = {
  APPROVED: {
    bg: OVERTIME_COLORS.SUCCESS_LIGHT,
    text: OVERTIME_COLORS.SUCCESS,
    icon: 'checkmark-circle',
  },
  REJECTED: {
    bg: OVERTIME_COLORS.DANGER_LIGHT,
    text: OVERTIME_COLORS.DANGER,
    icon: 'close-circle',
  },
  PENDING: {
    bg: OVERTIME_COLORS.WARNING_LIGHT,
    text: OVERTIME_COLORS.WARNING,
    icon: 'time',
  },
} as const;