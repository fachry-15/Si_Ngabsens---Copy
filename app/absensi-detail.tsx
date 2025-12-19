import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'; // Import Stack
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

// --- Font Definition for Consistency ---
const FONT = {
  REGULAR: 'Fredoka-Regular',
  MEDIUM: 'Fredoka-Medium',
  SEMIBOLD: 'Fredoka-SemiBold',
  BOLD: 'Fredoka-Bold',
};

export default function AbsensiDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Ambil data dari params (Pastikan tipe data string)
  const status = params.status as string;
  const keterangan = params.keterangan as string;
  const dateStr = params.date as string;
  const timeStr = params.time as string;
  const notes = params.notes as string;
  const area = params.area as string;
  const division = params.division as string;

  // Format tanggal dan waktu lebih rapi
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const datePart = dateStr.split('T')[0];
    const date = new Date(datePart);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(':');
      return `${h}:${m} WIB`;
    }
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} WIB`;
  };

  const isCheckIn = status === 'check_in' || status?.toLowerCase().includes('in');
  const typeText = isCheckIn ? 'Check In' : (status === 'check_out' ? 'Check Out' : status || 'Absensi');
  
  const getKeteranganTheme = (ket: string) => {
      const normKet = ket?.toLowerCase() || 'unknown';
      if (normKet.includes('telat')) return { color: '#EF4444', background: '#FEE2E2', textColor: '#EF4444' };
      if (normKet.includes('tepat waktu') || normKet.includes('present')) return { color: '#10B981', background: '#D1FAE5', textColor: '#10B981' };
      if (normKet.includes('lebih awal')) return { color: '#F59E0B', background: '#FEF3C7', textColor: '#F59E0B' };
      return { color: '#2b5597', background: '#E0E7FF', textColor: '#2b5597' };
  };

  const theme = getKeteranganTheme(keterangan);
  const iconColor = isCheckIn ? '#10B981' : '#2b5597';

  const InfoRow = ({ iconName, label, value, isLocation = false, isNotes = false }) => (
    <View style={styles.infoRowContainer}>
      <View style={styles.infoIconWrapper}>
          <Ionicons name={iconName} size={20} color="#2b5597" />
      </View>
      <View style={styles.infoTextWrapper}>
        <Text style={styles.infoLabelText}>{label}</Text>
        <Text style={[
            styles.infoValueText, 
            isLocation && styles.locationValueText,
            isNotes && { color: '#F59E0B', fontFamily: FONT.MEDIUM, fontStyle: 'italic', flex: 1, flexWrap: 'wrap' }
        ]}>
            {value && value !== 'null' ? value : '-'}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      {/* 1. Hilangkan Header Stack Navigator bawaan Expo Router */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={styles.container}>
        {/* 2. Custom Header yang lebih bersih (dipertahankan) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Absensi</Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.content}>
          
          {/* --- Card 1: Status & Waktu --- */}
          <View style={styles.mainCard}>
            <View style={styles.typeRow}>
              {/* Tipe Absensi Icon */}
              <View style={[styles.typeIconCircle, { backgroundColor: iconColor }]}>
                <Ionicons name={isCheckIn ? 'log-in-outline' : 'log-out-outline'} size={28} color="#fff" />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={styles.typeLabel}>{typeText}</Text>
                <Text style={styles.typeDateTime}>{formatDate(dateStr)}</Text>
              </View>
              
              {/* Keterangan Badge */}
              <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
                <Text style={[styles.statusBadgeText, { color: theme.textColor }]}>{keterangan || '-'}</Text>
              </View>
            </View>

            {/* Waktu Absensi (Besar) */}
            <View style={styles.timeSection}>
              <Text style={styles.timeValue}>{formatTime(timeStr)}</Text>
              <Ionicons name="alarm-outline" size={40} color="#E0E7FF" />
            </View>
          </View>

          {/* --- Card 2: Lokasi & Area --- */}
          <View style={styles.locationCard}>
            <View style={styles.locationCardHeader}>
                <Ionicons name="location-sharp" size={24} color="#2b5597" />
                <Text style={styles.locationTitle}>Informasi Lokasi</Text>
            </View>
            
            <InfoRow 
              iconName="map-outline" 
              label="Area Kerja" 
              value={area} 
              isLocation 
            />
            <InfoRow 
              iconName="business-outline" 
              label="Divisi" 
              value={division} 
              isLocation 
            />
          </View>
          
          {/* --- Card 3: Catatan --- */}
          {notes && notes !== 'null' && (
              <View style={styles.notesCard}>
                   <InfoRow 
                      iconName="document-text-outline" 
                      label="Catatan" 
                      value={notes} 
                      isNotes 
                  />
              </View>
          )}
          
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  // --- Layout & Base ---
  container: { flex: 1, backgroundColor: '#F5F7FA' }, // Light clean background
  header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 14, 
      backgroundColor: '#fff', 
      borderBottomWidth: 1, 
      borderBottomColor: '#E5E7EB',
  },
  backBtn: { 
      marginRight: 16, 
      padding: 4, 
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
      height: 40,
      width: 40,
      justifyContent: 'center',
      alignItems: 'center',
  },
  headerTitle: { 
      fontSize: 22, 
      fontFamily: FONT.BOLD, 
      color: '#1F2937', 
      letterSpacing: 0.2 
  },
  content: { 
      padding: 20, 
      gap: 16,
  },
  
  // --- Main Card (Status & Time) ---
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  typeIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONT.MEDIUM,
  },
  typeDateTime: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: FONT.SEMIBOLD,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: FONT.BOLD,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 38,
    fontFamily: FONT.BOLD,
    color: '#2b5597',
  },
  
  // --- Info Row Component Styles ---
  infoRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    gap: 12,
  },
  infoIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabelText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: FONT.MEDIUM,
    minWidth: 100,
  },
  infoValueText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: FONT.REGULAR,
    flexShrink: 1,
    textAlign: 'right',
  },
  locationValueText: {
    fontFamily: FONT.SEMIBOLD,
    color: '#2b5597',
  },

  // --- Location Card ---
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  locationCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      marginBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      gap: 8,
  },
  locationTitle: {
      fontSize: 18,
      fontFamily: FONT.BOLD,
      color: '#2b5597',
  },
  
  // --- Notes Card ---
  notesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  }
});