import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomModal from '../../components/CustomModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStore } from '../../store/authStore';

// --- Font Definition ---
const FONT = {
  REGULAR: 'Fredoka-Regular',
  MEDIUM: 'Fredoka-Medium',
  SEMIBOLD: 'Fredoka-SemiBold',
  BOLD: 'Fredoka-Bold',
};

// --- Color Palette ---
const COLORS = {
  PRIMARY: '#2b5597',
  PRIMARY_LIGHT: '#eef2ff',
  TEXT_MAIN: '#1E293B',
  TEXT_SUB: '#64748B',
  BG_SCREEN: '#F8FAFC',
  WHITE: '#FFFFFF',
  DANGER: '#EF4444',
  DANGER_LIGHT: '#FFF1F2',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(authStore.getState().user);

  useEffect(() => {
    const unsubscribe = authStore.subscribe((state) => {
      setUser(state.user); 
    });
    return unsubscribe;
  }, []);

  const [modal, setModal] = useState<{visible: boolean, type?: 'success' | 'error' | 'info', title: string, message: string, onConfirm?: () => void}>({visible: false, type: 'info', title: '', message: ''});
  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string, onConfirm?: () => void) => {
    setModal({ visible: true, type, title, message, onConfirm });
  };
  const hideModal = () => {
    setModal(m => ({ ...m, visible: false }));
    if (modal.onConfirm) modal.onConfirm();
  };
  const handleLogout = () => {
    showModal(
      'info',
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun ini?',
      async () => {
        await authStore.logout();
        router.replace('/login');
      }
    );
  };
  
  const getDivision = () => {
    console.log('🔍 [Profile getDivision] Debug user object:', JSON.stringify(user, null, 2));
    
    let divisionName = '';
    let areaName = '';
    
    // Try different possible structures from API
    // Structure 1: user.division_id (object)
    if (user?.division_id && typeof user.division_id === 'object') {
      const divObj = user.division_id as any;
      console.log('📦 [Profile] Division object:', JSON.stringify(divObj, null, 2));
      
      if (divObj.name) divisionName = divObj.name;
      if (divObj.area?.name) areaName = divObj.area.name;
    }
    
    // Structure 2: user.division (object)
    if (!divisionName && user?.division && typeof user.division === 'object') {
      const divObj = user.division as any;
      console.log('📦 [Profile] Division object (alt):', JSON.stringify(divObj, null, 2));
      
      if (divObj.name) divisionName = divObj.name;
      if (divObj.area?.name) areaName = divObj.area.name;
    }
    
    // Structure 3: user.area (direct)
    if (!areaName && user?.area && typeof user.area === 'object') {
      const areaObj = user.area as any;
      console.log('📍 [Profile] Area object:', JSON.stringify(areaObj, null, 2));
      
      if (areaObj.name) areaName = areaObj.name;
    }
    
    // Structure 4: direct string fields
    if (!divisionName && (user as any)?.division_name) {
      divisionName = (user as any).division_name;
    }
    if (!areaName && (user as any)?.area_name) {
      areaName = (user as any).area_name;
    }

    const result = areaName && divisionName 
      ? `${areaName} • ${divisionName}` 
      : areaName || divisionName || '-';
    
    console.log('✅ [Profile getDivision] Result:', result);
    return result;
  }

  return (
    <>
      <CustomModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={hideModal}
        confirmText={modal.type === 'info' ? 'Ya, Keluar' : 'OK'}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent} 
        >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.profileHero}>
            <View style={styles.imageContainer}>
              <Image
                source={require('../../assets/images/logo-pal.png')}
                style={styles.profileImage}
                resizeMode="contain"
              />
              <View style={styles.activeBadge} />
            </View>
            <Text style={styles.profileName}>{user?.name || 'Nama Karyawan'}</Text>
            <Text style={styles.profileRole}>{user?.role || 'Karyawan'}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>INFORMASI PEKERJAAN</Text>
          </View>

          <View style={styles.infoCard}>
            <InfoItem 
              icon="id-card-outline" 
              label="NIP / ID" 
              value={user?.nip || '-'} 
            />
            <InfoItem 
              icon="business-outline" 
              label="Area & Divisi" 
              value={getDivision()} 
            />
            <InfoItem 
              icon="mail-outline" 
              label="Email" 
              value={user?.email || '-'} 
            />
            <InfoItem 
              icon="calendar-outline" 
              label="Tanggal Bergabung" 
              value={user?.join_date || '-'} 
              isLast
            />
          </View>
        </View>

        {/* Logout Section */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.DANGER} />
          <Text style={styles.logoutText}>Keluar Akun</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Versi Aplikasi 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
} // <--- BARIS INI TADI KURANG / HILANG

// Sub-component for Clean Info Items
const InfoItem = ({ icon, label, value, isLast }: any) => (
  <View style={[styles.infoItem, isLast && { borderBottomWidth: 0 }]}>
    <View style={styles.infoIconWrapper}>
      <Ionicons name={icon} size={20} color={COLORS.PRIMARY} />
    </View>
    <View style={styles.infoTextWrapper}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_SCREEN,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
    marginBottom: 30,
  },
  profileHero: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
    backgroundColor: COLORS.BG_SCREEN,
    borderRadius: 55,
    padding: 15,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY_LIGHT,
  },
  profileImage: {
    width: 80,
    height: 80,
  },
  activeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  profileName: {
    fontSize: 22,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_MAIN,
  },
  profileRole: {
    fontSize: 14,
    fontFamily: FONT.MEDIUM,
    color: COLORS.PRIMARY,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionLabelRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: FONT.BOLD,
    color: COLORS.TEXT_SUB,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG_SCREEN,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: FONT.REGULAR,
    color: COLORS.TEXT_SUB,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: FONT.SEMIBOLD,
    color: COLORS.TEXT_MAIN,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.DANGER_LIGHT,
    marginHorizontal: 24,
    marginTop: 40,
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: COLORS.DANGER,
    fontFamily: FONT.BOLD,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    fontFamily: FONT.REGULAR,
    color: '#CBD5E1',
  }
});