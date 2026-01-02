import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERTIME_COLORS } from '../../constants/overtime';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Cari berdasarkan tanggal atau alasan...',
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={OVERTIME_COLORS.TEXT_SECONDARY} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={OVERTIME_COLORS.TEXT_SECONDARY}
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={20}
          color={OVERTIME_COLORS.TEXT_SECONDARY}
          style={styles.clearIcon}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Fredoka-Medium',
    color: OVERTIME_COLORS.TEXT_PRIMARY,
  },
  clearIcon: {
    marginLeft: 8,
  },
});
