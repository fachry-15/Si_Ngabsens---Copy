import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AbsensiHeader } from '../components/absensi/AbsensiHeader';
import { AbsensiMainCard } from '../components/absensi/AbsensiMainCard';
import { LocationCard } from '../components/absensi/LocationCard';
import { NotesCard } from '../components/absensi/NotesCard';
import { COLORS } from '../constants/absensi.constants';
import type { AbsensiDetailParams } from '../types/absensi';
import {
  formatDateFull,
  formatTimeWIB,
  getAbsensiTypeLabel,
  getKeteranganTheme,
  isCheckInType
} from '../utils/dateHelper';

export default function AbsensiDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as unknown as AbsensiDetailParams;

  const { status, keterangan, date, time, notes, area, division } = params;

  // Memoize computed values
  const { 
    dateFormatted, 
    timeFormatted, 
    theme, 
    isCheckIn, 
    typeText 
  } = useMemo(() => ({
    dateFormatted: formatDateFull(date),
    timeFormatted: formatTimeWIB(time),
    theme: getKeteranganTheme(keterangan),
    isCheckIn: isCheckInType(status),
    typeText: getAbsensiTypeLabel(status),
  }), [status, keterangan, date, time]);

  const handleBack = () => router.back();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={styles.container}>
        <AbsensiHeader onBack={handleBack} />
        
        <ScrollView contentContainerStyle={styles.content}>
          <AbsensiMainCard
            typeText={typeText}
            dateFormatted={dateFormatted}
            timeFormatted={timeFormatted}
            keterangan={keterangan}
            theme={theme}
            isCheckIn={isCheckIn}
          />
          
          <LocationCard area={area} division={division} />
          
          <NotesCard notes={notes || ''} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.BACKGROUND 
  },
  content: { 
    padding: 20, 
    gap: 16 
  },
});