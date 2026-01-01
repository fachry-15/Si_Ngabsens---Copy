/**
 * Bottom Navigation Component
 * Komponen navigasi bawah dengan FAB di tengah
 */

import { useRouter, useSegments } from 'expo-router';
import React, { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { NAV_CONFIG } from '../constants/navigationConfig';
import { AppColors } from '../constants/theme';
import { NavItem } from './navigation/NavItem';

const { width } = Dimensions.get('window');

export default function BottomNavigation(): React.JSX.Element {
  const router = useRouter();
  const segments = useSegments();
  
  // Logika penentuan tab aktif yang dioptimalkan
  const currentTab = useMemo(() => {
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || lastSegment === '(tabs)') return 'index';
    return lastSegment;
  }, [segments]);

  const navTo = (path: string): void => {
    router.push(path as any);
  };

  return (
    <View style={styles.mainWrapper} pointerEvents="box-none">
      {/* Background Notch */}
      <View style={styles.notchCutter} />

      <View style={styles.barContainer}>
        {/* Sisi Kiri */}
        <View style={styles.sideSection}>
          {NAV_CONFIG.left.map((item) => (
            <NavItem key={item.id} item={item} activeId={currentTab} onPress={navTo} />
          ))}
        </View>

        <View style={styles.centerGap} />

        {/* Sisi Kanan */}
        <View style={styles.sideSection}>
          {NAV_CONFIG.right.map((item) => (
            <NavItem key={item.id} item={item} activeId={currentTab} onPress={navTo} />
          ))}
        </View>
      </View>

      {/* FAB Home di Tengah */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <NavItem 
          item={NAV_CONFIG.center} 
          activeId={currentTab} 
          onPress={navTo} 
          isFab 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  barContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.WHITE,
    width: width * 0.94,
    height: 75,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 10 
      },
      android: { elevation: 8 },
    }),
  },
  notchCutter: {
    position: 'absolute',
    top: 0, 
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: AppColors.BG_SCREEN,
    zIndex: 0,
  },
  sideSection: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerGap: { 
    flex: 1.2 
  },
  fabWrapper: { 
    position: 'absolute', 
    bottom: 40, 
    zIndex: 1001 
  },
});