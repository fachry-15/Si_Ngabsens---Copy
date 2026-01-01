import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, COLORS } from '../../constants/absensi.constants';

interface AbsensiHeaderProps {
  onBack: () => void;
  title?: string;
}

export const AbsensiHeader: React.FC<AbsensiHeaderProps> = ({ 
  onBack, 
  title = 'Detail Absensi' 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={26} color={COLORS.GRAY_900} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    backgroundColor: COLORS.WHITE, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.GRAY_200,
  },
  backButton: { 
    marginRight: 16, 
    padding: 4, 
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_100,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { 
    fontSize: 22, 
    fontFamily: FONT.BOLD, 
    color: COLORS.GRAY_900, 
    letterSpacing: 0.2 
  },
});