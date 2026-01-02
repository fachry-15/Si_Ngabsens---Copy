import { FACE_REGISTER_CONFIG } from '@/constants/faceRegistration';
import { faceService } from '@/services/faceVectorService';
import { EnrollStep, FaceRegistrationModalState } from '@/types/faceRegistration';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import { useResizePlugin } from 'vision-camera-resize-plugin';

interface UseFaceRegistrationReturn {
  device: any;
  hasPermission: boolean;
  requestPermission: () => void;
  cameraRef: React.RefObject<any>;
  faceVector: number[] | null;
  isFaceDetected: boolean;
  enrollStep: EnrollStep;
  enrollProgress: any;
  loading: boolean;
  modal: FaceRegistrationModalState;
  setModal: (modal: FaceRegistrationModalState) => void;
  onSave: () => Promise<void>;
  frameProcessor: any;
}

export function useFaceRegistration(): UseFaceRegistrationReturn {
  const router = useRouter();
  const cameraRef = useRef<any>(null);
  const lastProcessedTime = useRef(0);

  const [faceVector, setFaceVector] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [enrollStep, setEnrollStep] = useState<EnrollStep>('CENTERING');
  const [modal, setModal] = useState<FaceRegistrationModalState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const enrollProgress = useSharedValue(0);

  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();
  
  const tflite = useTensorflowModel(require('@/assets/models/mobile_face_net.tflite'));
  const model = tflite.model;
  
  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    classificationMode: 'none',
  });

  const onEnrollmentComplete = Worklets.createRunOnJS((vector: number[]) => {
    setFaceVector(vector);
    setEnrollStep('READY');
  });

  const updateUIStatus = Worklets.createRunOnJS((detected: boolean, yaw: number) => {
    setIsFaceDetected(detected);
    
    if (!detected) {
      if (enrollStep !== 'READY') {
        setEnrollStep('CENTERING');
        enrollProgress.value = withTiming(0);
      }
      return;
    }

    if (enrollStep === 'CENTERING') {
      if (Math.abs(yaw) < FACE_REGISTER_CONFIG.YAW_THRESHOLD) {
        setEnrollStep('LIVENESS');
      }
    } else if (enrollStep === 'LIVENESS') {
      const move = Math.min(
        Math.abs(yaw) / FACE_REGISTER_CONFIG.YAW_PROGRESS_DIVISOR,
        1
      );
      if (move > enrollProgress.value) {
        enrollProgress.value = withTiming(move, { duration: 150 });
      }
      if (enrollProgress.value >= FACE_REGISTER_CONFIG.PROGRESS_THRESHOLD) {
        setEnrollStep('READY');
      }
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = Date.now();
    if (now - lastProcessedTime.current < FACE_REGISTER_CONFIG.FRAME_PROCESS_INTERVAL) return;
    lastProcessedTime.current = now;

    const faces = detectFaces(frame);
    if (faces.length > 0) {
      const face = faces[0];
      updateUIStatus(true, face.yawAngle);

      if (
        enrollProgress.value >= FACE_REGISTER_CONFIG.PROGRESS_THRESHOLD &&
        model != null &&
        !faceVector
      ) {
        const resized = resize(frame, {
          scale: {
            width: FACE_REGISTER_CONFIG.MODEL_INPUT_SIZE,
            height: FACE_REGISTER_CONFIG.MODEL_INPUT_SIZE,
          },
          pixelFormat: 'rgb',
          dataType: 'float32',
        });
        const output = model.runSync([resized]);
        if (output && output.length > 0) {
          onEnrollmentComplete(Array.from(output[0] as Float32Array));
        }
      }
    } else {
      updateUIStatus(false, 0);
    }
  }, [model, enrollStep, faceVector]);

  const onSave = useCallback(async (): Promise<void> => {
    if (!faceVector) return;
    setLoading(true);

    try {
      console.log('📤 Mengirim vektor wajah ke server...');
      console.log('Vector length:', faceVector.length);
      
      const result = await faceService.registerFaceVector(faceVector);
      
      console.log('📥 Response dari server:', result);
      
      if (result.success) {
        setModal({
          visible: true,
          type: 'success',
          title: 'Berhasil!',
          message: 'Wajah kamu sudah terdaftar. Sekarang kamu bisa absen pakai wajah!',
        });
      } else {
        setModal({
          visible: true,
          type: 'error',
          title: 'Gagal',
          message: result.message || 'Data tidak tersimpan, coba lagi ya.',
        });
      }
    } catch (error) {
      console.error('❌ Error saat registrasi:', error);
      setModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'Ada gangguan koneksi ke server.',
      });
    } finally {
      setLoading(false);
    }
  }, [faceVector]);

  return {
    device,
    hasPermission,
    requestPermission,
    cameraRef,
    faceVector,
    isFaceDetected,
    enrollStep,
    enrollProgress,
    loading,
    modal,
    setModal,
    onSave,
    frameProcessor,
  };
}