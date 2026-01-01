import { FACE_COLORS } from '@/constants/faceRegistration';
import { EnrollStep } from '@/types/faceRegistration';
import { interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';

export function useFaceAnimation(enrollProgress: any, enrollStep: EnrollStep) {
  const progressStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      enrollProgress.value,
      [0, 1],
      [FACE_COLORS.PRIMARY, FACE_COLORS.SUCCESS]
    );

    return {
      borderColor: enrollStep === 'READY' ? FACE_COLORS.SUCCESS : color,
      borderTopColor: enrollStep === 'READY' ? FACE_COLORS.SUCCESS : color,
      borderRightColor:
        enrollProgress.value > 0.25 || enrollStep === 'READY' ? color : 'transparent',
      borderBottomColor:
        enrollProgress.value > 0.5 || enrollStep === 'READY' ? color : 'transparent',
      borderLeftColor:
        enrollProgress.value > 0.75 || enrollStep === 'READY' ? color : 'transparent',
      transform: [{ rotate: `${interpolate(enrollProgress.value, [0, 1], [0, 360])}deg` }],
    };
  });

  return { progressStyle };
}