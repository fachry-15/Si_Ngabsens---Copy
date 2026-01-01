/**
 * Type definitions untuk Navigation System
 */

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export interface NavigationConfig {
  left: NavItem[];
  right: NavItem[];
  center: NavItem;
}

export interface NavItemProps {
  item: NavItem;
  activeId: string;
  onPress: (path: string) => void;
  isFab?: boolean;
}
