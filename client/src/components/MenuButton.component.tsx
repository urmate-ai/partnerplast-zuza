import React from 'react';
import { Pressable } from 'react-native';
import { View } from '../shared/components/View.component';

type MenuButtonProps = {
  onPress?: () => void;
};

export const MenuButton: React.FC<MenuButtonProps> = ({ onPress }) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Otwórz menu"
      onPress={onPress}
    >
      <View className="w-9 h-9 rounded-full items-center justify-center">
        <View className="w-4.5 h-0.5 rounded-sm bg-gray-900 mb-0.5" />
        <View className="w-4.5 h-0.5 rounded-sm bg-gray-900 mb-0.5" />
        <View className="w-4.5 h-0.5 rounded-sm bg-gray-900" />
      </View>
    </Pressable>
  );
};
