import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { Camera } from 'react-native-vision-camera';
import { FACE_COLORS, FACE_REGISTER_CONFIG } from '@/constants/faceRegistration';
import { EnrollStep } from '@/types/faceRegistration';

interface CameraPreviewProps {
  cameraRef: React.RefObject<Camera>;
  device: any;
  frameProcessor: any;
  enrollStep: EnrollStep;
  progressStyle: AnimatedStyle;
}

export function CameraPreview({
  cameraRef,
  device,
  frameProcessor,
  enrollStep,
  progressStyle,
}: CameraPreviewProps): React.JSX.Element {
  const cameraSize = FACE_REGISTER_CONFIG.CAMERA_SIZE;

  return (
    <View style={styles.cameraContainer}>
      <View style={styles.outerCircle}>
        <Animated.View style={[styles.progressRing, progressStyle]} />
        <View style={styles.cameraCircle}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
          />
          {enrollStep === 'READY' ? (
            <View style={styles.successOverlay}>
              <Ionicons name="checkmark-circle" size={80} color={FACE_COLORS.SUCCESS} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const cameraSize = FACE_REGISTER_CONFIG.CAMERA_SIZE;

const styles = StyleSheet.create({
  cameraContainer: {
    width: cameraSize + 40,
    height: cameraSize + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: cameraSize + 20,
    height: cameraSize + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: cameraSize + 10,
    height: cameraSize + 10,
    borderRadius: (cameraSize + 10) / 2,
    borderWidth: 6,
  },
  cameraCircle: {
    width: cameraSize,
    height: cameraSize,
    borderRadius: cameraSize / 2,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: FACE_COLORS.WHITE,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});