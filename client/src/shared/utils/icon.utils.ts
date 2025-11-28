import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

export const isValidIconName = (name: string | undefined): name is IconName => {
  if (!name) return false;
  return typeof name === 'string' && name.length > 0;
};

export const getSafeIconName = (
  iconName: string | undefined,
  fallback: IconName = 'link-outline',
): IconName => {
  return isValidIconName(iconName) ? iconName : fallback;
};

