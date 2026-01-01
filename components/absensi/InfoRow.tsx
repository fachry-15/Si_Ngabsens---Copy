import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, COLORS } from '../../constants/absensi.constants';

interface InfoRowProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLocation?: boolean;
  isNotes?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({ 
  iconName, 
  label, 
  value, 
  isLocation = false, 
  isNotes = false 
}) => {
  const displayValue = value && value !== 'null' ? value : '-';
  
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={iconName} size={20} color={COLORS.PRIMARY} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={[
          styles.valueText, 
          isLocation && styles.locationValueText,
          isNotes && styles.notesValueText
        ]}>
          {displayValue}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_50,
    gap: 12,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    fontFamily: FONT.MEDIUM,
    minWidth: 100,
  },
  valueText: {
    fontSize: 14,
    color: COLORS.GRAY_900,
    fontFamily: FONT.REGULAR,
    flexShrink: 1,
    textAlign: 'right',
  },
  locationValueText: {
    fontFamily: FONT.SEMIBOLD,
    color: COLORS.PRIMARY,
  },
  notesValueText: {
    color: COLORS.WARNING,
    fontFamily: FONT.MEDIUM,
    fontStyle: 'italic',
    flex: 1,
    flexWrap: 'wrap',
  },
});