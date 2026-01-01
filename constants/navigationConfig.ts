import { NavigationConfig } from '../types/navigation';

export const NAV_CONFIG: NavigationConfig = {
  left: [
    { 
      id: 'history', 
      label: 'Riwayat', 
      icon: 'time', 
      path: '/(tabs)/history' 
    },
    { 
      id: 'calendar', 
      label: 'Kalender', 
      icon: 'calendar', 
      path: '/(tabs)/calendar' 
    },
  ],
  right: [
    { 
      id: 'overtime', 
      label: 'Lembur', 
      icon: 'briefcase', 
      path: '/(tabs)/overtime' 
    },
    { 
      id: 'profile', 
      label: 'Profil', 
      icon: 'person', 
      path: '/(tabs)/profile' 
    },
  ],
  center: { 
    id: 'index', 
    label: 'Home', 
    icon: 'home', 
    path: '/(tabs)' 
  }
};
