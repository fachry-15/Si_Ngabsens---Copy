import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FACE_COLORS } from '@/constants/faceRegistration';

interface FaceRegisterHeaderProps {
  onBack: () => void;
}

export function FaceRegisterHeader({ onBack }: FaceRegisterHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color={FACE_COLORS.TEXT} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Daftar Biometrik</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FACE_COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Fredoka-SemiBold',
    color: FACE_COLORS.TEXT,
  },
  placeholder: {
    width: 40,
  },
});