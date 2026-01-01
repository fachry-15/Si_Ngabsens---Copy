import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FACE_COLORS } from '@/constants/faceRegistration';
import { EnrollStep } from '@/types/faceRegistration';

interface SaveFaceButtonProps {
  onPress: () => void;
  loading: boolean;
  enrollStep: EnrollStep;
}

export function SaveFaceButton({
  onPress,
  loading,
  enrollStep,
}: SaveFaceButtonProps): React.JSX.Element {
  const isDisabled = loading || enrollStep !== 'READY';

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.primaryBtn, isDisabled && styles.btnDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={FACE_COLORS.WHITE} />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>Simpan Wajah Saya</Text>
            <Ionicons name="chevron-forward" size={20} color={FACE_COLORS.WHITE} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 25,
    backgroundColor: FACE_COLORS.WHITE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  primaryBtn: {
    backgroundColor: FACE_COLORS.PRIMARY,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: FACE_COLORS.DISABLED,
    elevation: 0,
  },
  primaryBtnText: {
    color: FACE_COLORS.WHITE,
    fontFamily: 'Fredoka-SemiBold',
    fontSize: 16,
  },
});