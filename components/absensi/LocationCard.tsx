import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, COLORS } from '../../constants/absensi.constants';
import { InfoRow } from './InfoRow';

interface LocationCardProps {
  area: string;
  division: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({ area, division }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location-sharp" size={24} color={COLORS.PRIMARY} />
        <Text style={styles.title}>Informasi Lokasi</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.BOLD,
    color: COLORS.PRIMARY,
  },
});