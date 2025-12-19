import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';

export default function BottomNavigation() {
  const router = useRouter();
  const segments = useSegments();
  
  const currentTab = segments[segments.length - 1] || 'index';

  const isActive = (tabName: string) => {
    if (tabName === 'index') {
      return currentTab === 'index' || currentTab === '(tabs)' || !currentTab;
    }
    return currentTab === tabName;
  };

  const navTo = (path: string) => {
    router.push(path);
  };

  return (
    <View style={styles.mainWrapper} pointerEvents="box-none">
      {/* Bar Navigasi Putih */}
      <View style={styles.barBackground}>
        
        {/* SISI KIRI */}
        <View style={styles.sideSection}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navTo('/(tabs)/history')}
          >
            <Ionicons 
              name={isActive('history') ? 'bar-chart' : 'bar-chart-outline'} 
              size={22} 
              color={isActive('history') ? '#2b5597' : '#9CA3AF'}
            />
            <Text style={[styles.navLabel, isActive('history') && styles.activeText]}>Riwayat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navTo('/(tabs)/calendar')}
          >
            <Ionicons
              name={isActive('calendar') ? 'calendar' : 'calendar-outline'}
              size={22}
              color={isActive('calendar') ? '#2b5597' : '#9CA3AF'}
            />
            <Text style={[styles.navLabel, isActive('calendar') && styles.activeText]}>Kalender</Text>
          </TouchableOpacity>
        </View>

        {/* RUANG KOSONG UNTUK TOMBOL HOME */}
        <View style={styles.centerGap} />

        {/* SISI KANAN */}
        <View style={styles.sideSection}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navTo('/(tabs)/profile')}
          >
            <Ionicons 
              name={isActive('profile') ? 'person' : 'person-outline'} 
              size={22} 
              color={isActive('profile') ? '#2b5597' : '#9CA3AF'}
            />
            <Text style={[styles.navLabel, isActive('profile') && styles.activeText]}>Profil</Text>
          </TouchableOpacity>

          {/* Tombol tambahan atau Menu */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navTo('/(tabs)/overtime')}
          >
            <Ionicons 
              name="grid-outline" 
              size={22} 
              color={isActive('overtime') ? '#2b5597' : '#9CA3AF'}
            />
            <Text style={[styles.navLabel, isActive('overtime') && styles.activeText]}>Lembur</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TOMBOL HOME TENGAH (FLOATING) */}
      <View style={styles.centerButtonWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => navTo('/(tabs)')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isActive('index') ? 'home' : 'home-outline'} 
            size={28} 
            color="#fff" 
          />
          <Text style={styles.centerButtonLabel}>Beranda</Text>
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
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  barBackground: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '94%',
    height: 65,
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  sideSection: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerGap: {
    flex: 1.2, // Memberikan ruang agar tombol kiri/kanan tidak tumpang tindih dengan Home
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  navLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'Fredoka-Medium',
  },
  activeText: {
    color: '#2b5597',
    fontFamily: 'Fredoka-SemiBold',
  },
  centerButtonWrapper: {
    position: 'absolute',
    bottom: 30, // Mengambang di atas bar
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  centerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2b5597',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#F5F7FA', // Sesuaikan dengan warna background utama app anda
    ...Platform.select({
      ios: {
        shadowColor: '#2b5597',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  centerButtonLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Fredoka-Bold',
    marginTop: -2,
  },
});