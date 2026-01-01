import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT } from '@/constants/home';

interface HomeHeaderProps {
  userName: string;
  onProfilePress: () => void;
}

export function HomeHeader({ userName, onProfilePress }: HomeHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Halo, Selamat Bekerja!</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>
      <TouchableOpacity onPress={onProfilePress} style={styles.profileBtn}>
        <Image 
          source={require('@/assets/images/logo-pal.png')} 
          style={styles.logo} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 25,
  },
  greeting: {
    fontSize: 13,
    fontFamily: FONT.REGULAR,
    color: COLORS.TEXT_SUB,
  },
  userName: {
    fontSize: 22,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  logo: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
});