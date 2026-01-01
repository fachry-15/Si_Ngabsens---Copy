import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const FACE_REGISTER_CONFIG = {
  CAMERA_SIZE: screenWidth * 0.75,
  FRAME_PROCESS_INTERVAL: 200,
  YAW_THRESHOLD: 15,
  YAW_PROGRESS_DIVISOR: 18,
  PROGRESS_THRESHOLD: 0.85,
  MODEL_INPUT_SIZE: 112,
} as const;

export const FACE_COLORS = {
  PRIMARY: '#2D8A61',
  SUCCESS: '#10B981',
  DANGER: '#EF4444',
  WHITE: '#FFFFFF',
  TEXT: '#1E293B',
  SUBTEXT: '#94A3B8',
  LIGHT_BG: '#F8FAFC',
  DISABLED: '#CBD5E1',
} as const;

export const STEP_INSTRUCTIONS = {
  NO_FACE: 'Posisikan wajahmu di tengah',
  CENTERING: 'Tatap lurus ke depan',
  LIVENESS: 'Gelengkan kepalamu ke kiri dan kanan',
  READY: 'Wajah berhasil dipindai!',
} as const;