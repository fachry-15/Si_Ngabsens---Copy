import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface LoginHeaderProps {
  step: 'nip' | 'password';
  nip: string;
}

export function LoginHeader({ step, nip }: LoginHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.imageBg}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop' }}
          style={styles.image}
        />
        <View style={styles.overlay} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>
            {step === 'nip' ? 'Sistem Absensi Karyawan' : `Masuk sebagai ${nip}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    backgroundColor: '#F5F7FA',
  },
  imageBg: {
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43, 85, 151, 0.88)',
  },
  textContainer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  title: {
    fontSize: 34,
    fontFamily: 'Fredoka-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Fredoka-Medium',
    color: '#E0E7FF',
    lineHeight: 22,
  },
});