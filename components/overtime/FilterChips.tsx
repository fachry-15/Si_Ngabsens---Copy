import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OVERTIME_COLORS } from '../../constants/overtime';

export type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

interface FilterChipsProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  selectedFilter,
  onFilterChange,
  counts,
}) => {
  const filters: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'Semua', icon: 'list' },
    { key: 'pending', label: 'Menunggu', icon: 'time' },
    { key: 'approved', label: 'Disetujui', icon: 'checkmark-circle' },
    { key: 'rejected', label: 'Ditolak', icon: 'close-circle' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.key;
        const count = counts[filter.key];

        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onFilterChange(filter.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon}
              size={16}
              color={isSelected ? '#fff' : OVERTIME_COLORS.TEXT_SECONDARY}
              style={styles.chipIcon}
            />
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {filter.label}
            </Text>
            {count > 0 && (
              <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: OVERTIME_COLORS.PRIMARY,
    borderColor: OVERTIME_COLORS.PRIMARY,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
    color: OVERTIME_COLORS.TEXT_SECONDARY,
  },
  chipTextSelected: {
    color: '#fff',
  },
  badge: {
    backgroundColor: OVERTIME_COLORS.BG,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Fredoka-SemiBold',
    color: OVERTIME_COLORS.TEXT_PRIMARY,
  },
  badgeTextSelected: {
    color: '#fff',
  },
});
