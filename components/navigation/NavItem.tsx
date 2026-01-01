import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AppColors } from '../../constants/theme';
import { NavItemProps } from '../../types/navigation';

export const NavItem: React.FC<NavItemProps> = ({ 
  item, 
  activeId, 
  onPress, 
  isFab = false 
}) => {
  const isActive = activeId === item.id;
  const iconName = isActive ? item.icon : `${item.icon}-outline`;
  
  return (
    <TouchableOpacity 
      style={isFab ? styles.fab : styles.navButton} 
      onPress={() => onPress(item.path)}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={iconName as any} 
        size={isFab ? 28 : 22} 
        color={isFab ? AppColors.WHITE : (isActive ? AppColors.PRIMARY : AppColors.INACTIVE)} 
      />
      <Text 
        style={[
          isFab ? styles.fabLabel : styles.navLabel, 
          (!isFab && isActive) && styles.activeLabel
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  navButton: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 5 
  },
  navLabel: { 
    fontSize: 10, 
    color: AppColors.INACTIVE, 
    marginTop: 4, 
    fontWeight: '500' 
  },
  activeLabel: { 
    color: AppColors.PRIMARY, 
    fontWeight: '700' 
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: AppColors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: AppColors.WHITE,
    ...Platform.select({
      ios: { 
        shadowColor: AppColors.PRIMARY, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 6 
      },
      android: { elevation: 6 },
    }),
  },
  fabLabel: { 
    fontSize: 9, 
    color: AppColors.WHITE, 
    fontWeight: 'bold', 
    marginTop: -2 
  },
});
