import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomNavigation() {
  const router = useRouter();
  const segments = useSegments();
  
  const currentTab = segments[segments.length - 1] || 'index';

  const isActive = (tabName: string) => {
    if (!tabName) return false;
    // Logika Home/Index
    if (tabName === 'index') {
      return currentTab === 'index' || currentTab === '(tabs)' || !currentTab;
    }
    return currentTab === tabName;
  };

  const navTo = (path: string) => {
    router.push(path);
  };

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        {/* === 1. KIRI: Board (History) === */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navTo('/(tabs)/history')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isActive('history') ? 'bar-chart' : 'bar-chart-outline'} 
            size={24} 
            color={isActive('history') ? styles.activeColor.color : styles.inactiveColor.color}
          />
          <Text style={[styles.navLabel, isActive('history') && styles.activeColor]}>Riwayat</Text>
        </TouchableOpacity>

        {/* === 2. Spacer Kiri (Menjaga jarak untuk Tombol Tengah) === */}
        <View style={styles.centerSpacer} />

        {/* === 3. KANAN: Profile === */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navTo('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isActive('profile') ? 'person' : 'person-outline'} 
            size={24} 
            color={isActive('profile') ? styles.activeColor.color : styles.inactiveColor.color}
          />
          <Text style={[styles.navLabel, isActive('profile') && styles.activeColor]}>Profil</Text>
        </TouchableOpacity>

      </View>

      {/* === TOMBOL TENGAH BESAR: HOME === */}
      <View style={styles.centerButtonWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => navTo('/(tabs)')} // Arahkan ke Home
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isActive('index') ? 'home' : 'home-outline'} // Menggunakan ikon Home
            size={32} 
            color="#fff" 
          />
          <Text style={styles.centerButtonLabel}>Beranda</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Color Definitions ---
  activeColor: {
    color: '#2b5597', // Biru Aktif
  },
  inactiveColor: {
    color: '#9CA3AF', // Abu-abu Tidak Aktif
  },
  
  // --- Container Styling ---
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 999,
    height: 100, // Tinggi yang cukup untuk bar dan tombol mengambang
    backgroundColor: 'transparent', 
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Menggunakan space-around untuk mendistribusikan 2 tombol dan spacer secara merata
    justifyContent: 'space-around', 
    backgroundColor: '#FFFFFF', // Latar belakang putih
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingTop: 18, 
    paddingBottom: 15, 
    width: '90%', 
    height: 75, // Tinggi Bar Utama
    
    // Shadow yang lebih halus
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    
    position: 'absolute',
    bottom: 10, // Mengangkat sedikit dari bawah
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    flex: 1, 
    // MaxWidth dihilangkan, Flex akan menyesuaikan ruang
    height: 50,
  },
  navLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500', 
    fontFamily: 'Fredoka-Medium',
  },
  // Spacer yang dihitung agar total lebar tombol dan spacer sesuai
  centerSpacer: {
    width: 80, // Memberi ruang kosong yang cukup besar untuk tombol Home
    height: 50,
  },
  // --- Center Button Styling (Tombol HOME) ---
  centerButtonWrapper: {
    position: 'absolute',
    left: '50%',
    top: 5, // Ditempatkan di atas bar (Tinggi Bar 75, Tombol 70. 75/2 - 70/2 = 2.5) -> top 5px dari bottomNav 10px
    transform: [{ translateX: -40 }], // Menggeser setengah lebar tombol (80px/2 = 40px)
    zIndex: 10,
    alignItems: 'center',
  },
  centerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2b5597', // Menggunakan warna primer Anda untuk Home
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2b5597',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, // Shadow yang kuat
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 4, 
    borderColor: '#FFFFFF',
  },
  centerButtonLabel: {
    fontSize: 10,
    color: '#FFFFFF', // Label warna putih
    fontWeight: '600',
    marginTop: 0, // Label diletakkan di dalam tombol, bukan di bawah
    fontFamily: 'Fredoka-Medium',
  }
});