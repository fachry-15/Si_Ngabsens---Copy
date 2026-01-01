import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FACE_COLORS, STEP_INSTRUCTIONS } from '@/constants/faceRegistration';
import { EnrollStep } from '@/types/faceRegistration';

interface FaceDetectionGuideProps {
  isFaceDetected: boolean;
  enrollStep: EnrollStep;
}

export function FaceDetectionGuide({
  isFaceDetected,
  enrollStep,
}: FaceDetectionGuideProps): React.JSX.Element {
  const getInstruction = (): string => {
    if (!isFaceDetected) return STEP_INSTRUCTIONS.NO_FACE;
    if (enrollStep === 'CENTERING') return STEP_INSTRUCTIONS.CENTERING;
    if (enrollStep === 'LIVENESS') return STEP_INSTRUCTIONS.LIVENESS;
    return STEP_INSTRUCTIONS.READY;
  };

  return (
    <View style={styles.guideBox}>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: isFaceDetected ? '#DCFCE7' : '#FEE2E2' },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: isFaceDetected ? FACE_COLORS.SUCCESS : FACE_COLORS.DANGER },
          ]}
        >
          {isFaceDetected ? 'WAJAH TERDETEKSI' : 'WAJAH BELUM TERLIHAT'}
        </Text>
      </View>

      <Text style={styles.instruction}>{getInstruction()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  guideBox: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Fredoka-SemiBold',
    textTransform: 'uppercase',
  },
  instruction: {
    fontSize: 18,
    fontFamily: 'Fredoka-SemiBold',
    color: FACE_COLORS.TEXT,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 26,
  },
});