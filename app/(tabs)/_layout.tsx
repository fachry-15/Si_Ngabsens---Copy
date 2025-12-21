import { Tabs } from 'expo-router';
import React from 'react';

import BottomNavigation from '@/components/BottomNavigation';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Toast from 'react-native-toast-message';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar, we use custom
        }}
        tabBar={() => <BottomNavigation />} // Custom bottom navigation
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Riwayat',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Kalender',
          }}
        />
        <Tabs.Screen
          name="overtime"
          options={{
            title: 'Jadwal Lembur',
          }}
        />
      </Tabs>
      <Toast />
    </>
  );
}
