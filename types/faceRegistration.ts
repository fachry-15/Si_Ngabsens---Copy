export type EnrollStep = 'CENTERING' | 'LIVENESS' | 'READY';

export interface FaceRegistrationModalState {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface FaceDetectionStatus {
  isDetected: boolean;
  yawAngle: number;
}

export interface CameraFrameData {
  faces: any[];
  timestamp: number;
}