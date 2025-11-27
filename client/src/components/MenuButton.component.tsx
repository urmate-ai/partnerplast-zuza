import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type MenuButtonProps = {
  onPress?: () => void;
};

export const MenuButton: React.FC<MenuButtonProps> = ({ onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Otwórz menu"
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Ionicons name="menu" size={28} color="#111827" />
    </TouchableOpacity>
  );
};
