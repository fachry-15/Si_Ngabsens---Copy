import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERTIME_COLORS } from '../../constants/overtime';

export type SortType = 'date-desc' | 'date-asc' | 'duration-desc' | 'duration-asc';

interface SortButtonProps {
  currentSort: SortType;
  onSortChange: (sort: SortType) => void;
}

export const SortButton: React.FC<SortButtonProps> = ({ currentSort, onSortChange }) => {
  const sortOptions: { key: SortType; label: string }[] = [
    { key: 'date-desc', label: 'Terbaru' },
    { key: 'date-asc', label: 'Terlama' },
    { key: 'duration-desc', label: 'Durasi Terpanjang' },
    { key: 'duration-asc', label: 'Durasi Terpendek' },
  ];

  const [showOptions, setShowOptions] = React.useState(false);

  const currentLabel = sortOptions.find((opt) => opt.key === currentSort)?.label || 'Urutkan';

  const handlePress = () => {
    // Cycle through sort options
    const currentIndex = sortOptions.findIndex((opt) => opt.key === currentSort);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSortChange(sortOptions[nextIndex].key);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <Ionicons name="swap-vertical" size={16} color={OVERTIME_COLORS.PRIMARY} />
      <Text style={styles.text}>{currentLabel}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: OVERTIME_COLORS.PRIMARY,
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
    color: OVERTIME_COLORS.PRIMARY,
  },
});
