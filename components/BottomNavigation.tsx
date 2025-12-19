import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  PRIMARY: '#2b5597', // Hijau profesional
  INACTIVE: '#94A3B8', // Abu-abu modern
  WHITE: '#FFFFFF',
  BG_SCREEN: '#F8FAFB', // Warna background layar utama Anda
};

const FONT_FAMILY = Platform.OS === 'ios' ? 'System' : 'sans-serif-medium';

export default function BottomNavigation() {
  const router = useRouter();
  const segments = useSegments();
  
  const currentTab = segments[segments.length - 1] || 'index';

  const isActive = (tabName: string) => {
    if (tabName === 'index') return currentTab === 'index' || currentTab === '(tabs)' || !currentTab;
    return currentTab === tabName;
  };

  const navTo = (path: string) => router.push(path);

  return (
    <View style={styles.mainWrapper} pointerEvents="box-none">
      
      {/* EFEK LEKUKAN (PENGGANTI SVG) */}
      <View style={styles.notchCutter} />

      <View style={styles.barContainer}>
        {/* SISI KIRI: RIWAYAT & KALENDER */}
        <View style={styles.sideSection}>
          <TouchableOpacity style={styles.navButton} onPress={() => navTo('/(tabs)/history')}>
            <Ionicons 
              name={isActive('history') ? "time" : "time-outline"} 
              size={22} 
              color={isActive('history') ? COLORS.PRIMARY : COLORS.INACTIVE} 
            />
            <Text style={[styles.navLabel, isActive('history') && styles.activeLabel]}>Riwayat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navTo('/(tabs)/calendar')}>
            <Ionicons 
              name={isActive('calendar') ? "calendar" : "calendar-outline"} 
              size={22} 
              color={isActive('calendar') ? COLORS.PRIMARY : COLORS.INACTIVE} 
            />
            <Text style={[styles.navLabel, isActive('calendar') && styles.activeLabel]}>Kalender</Text>
          </TouchableOpacity>
        </View>

        {/* GAP TENGAH UNTUK HOME */}
        <View style={styles.centerGap} />

        {/* SISI KANAN: LEMBUR & PROFIL */}
        <View style={styles.sideSection}>
          <TouchableOpacity style={styles.navButton} onPress={() => navTo('/(tabs)/overtime')}>
            <Ionicons 
              name={isActive('overtime') ? "briefcase" : "briefcase-outline"} 
              size={22} 
              color={isActive('overtime') ? COLORS.PRIMARY : COLORS.INACTIVE} 
            />
            <Text style={[styles.navLabel, isActive('overtime') && styles.activeLabel]}>Lembur</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navTo('/(tabs)/profile')}>
            <Ionicons 
              name={isActive('profile') ? "person" : "person-outline"} 
              size={22} 
              color={isActive('profile') ? COLORS.PRIMARY : COLORS.INACTIVE} 
            />
            <Text style={[styles.navLabel, isActive('profile') && styles.activeLabel]}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TOMBOL HOME (TENGAH) */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navTo('/(tabs)')}
          activeOpacity={0.9}
        >
          <Ionicons name={isActive('index') ? "home" : "home-outline"} size={28} color="#fff" />
          <Text style={styles.fabLabel}>Home</Text>
        </TouchableOpacity>
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
    backgroundColor: COLORS.WHITE,
    width: width * 0.94, // Sedikit lebih lebar agar proporsional dengan label
    height: 75,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  notchCutter: {
    position: 'absolute',
    top: 0, 
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.BG_SCREEN, // Harus sama dengan warna background layar utama
    zIndex: 0,
  },
  sideSection: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerGap: {
    flex: 1.2,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.INACTIVE,
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },
  activeLabel: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: COLORS.WHITE,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabLabel: {
    fontSize: 9,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginTop: -2,
  },
});