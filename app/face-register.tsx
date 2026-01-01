import CustomModal from '@/components/CustomModal';
import { CameraPreview } from '@/components/faceRegister/CameraPreview';
import { FaceDetectionGuide } from '@/components/faceRegister/FaceDetectionGuide';
import { FaceRegisterHeader } from '@/components/faceRegister/FaceRegisterHeader';
import { FaceRegisterTitle } from '@/components/faceRegister/FaceRegisterTitle';
import { SaveFaceButton } from '@/components/faceRegister/SaveFaceButton';
import { FACE_COLORS } from '@/constants/faceRegistration';
import { useFaceAnimation } from '@/hooks/useFaceAnimation';
import { useFaceRegistration } from '@/hooks/useFaceRegistration';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

export default function FaceRegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    device,
    hasPermission,
    requestPermission,
    cameraRef,
    isFaceDetected,
    enrollStep,
    enrollProgress,
    loading,
    modal,
    setModal,
    onSave,
    frameProcessor,
  } = useFaceRegistration();

  const { progressStyle } = useFaceAnimation(enrollProgress, enrollStep);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  if (!hasPermission || !device) {
    return <ActivityIndicator style={styles.loader} color={FACE_COLORS.PRIMARY} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <FaceRegisterHeader onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <FaceRegisterTitle />

        <CameraPreview
          cameraRef={cameraRef}
          device={device}
          frameProcessor={frameProcessor}
          enrollStep={enrollStep}
          progressStyle={progressStyle}
        />

        <FaceDetectionGuide isFaceDetected={isFaceDetected} enrollStep={enrollStep} />
      </ScrollView>

      <SaveFaceButton onPress={onSave} loading={loading} enrollStep={enrollStep} />

      <CustomModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
          if (modal.type === 'success') {
            router.replace('/(tabs)');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FACE_COLORS.LIGHT_BG,
  },
  loader: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 25,
    alignItems: 'center',
    paddingBottom: 120,
  },
});