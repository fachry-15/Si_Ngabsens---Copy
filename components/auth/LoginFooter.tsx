import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LoginFooterProps {
  onSettingsPress: () => void;
}

export function LoginFooter({ onSettingsPress }: LoginFooterProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/logo-pal.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.text}>PT PAL Indonesia</Text>
      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={16} color="#2b5597" />
        <Text style={styles.settingsText}>Pengaturan API</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    fontFamily: 'Fredoka-Bold',
    color: '#2b5597',
    marginBottom: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  settingsText: {
    fontSize: 12,
    color: '#2b5597',
    fontFamily: 'Fredoka-Medium',
  },
});