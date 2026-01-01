import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FACE_COLORS } from '@/constants/faceRegistration';

export function FaceRegisterTitle(): React.JSX.Element {
  return (
    <View style={styles.textWrapper}>
      <Text style={styles.mainTitle}>Halo! Yuk, Scan Wajahmu</Text>
      <Text style={styles.subTitle}>Ikuti instruksi agar proses pendaftaran lancar.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  textWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: FACE_COLORS.TEXT,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    fontFamily: 'Fredoka',
    color: FACE_COLORS.SUBTEXT,
    textAlign: 'center',
    marginTop: 8,
  },
});