import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
};

const menuItems: MenuItem[] = [
  { icon: 'create-outline', label: 'Nowy czat' },
  { icon: 'search-outline', label: 'Wyszukaj czaty' },
  { icon: 'link-outline', label: 'Integracje' },
  { icon: 'settings-outline', label: 'Ustawienia' },
];

export const DrawerMenuItems: React.FC = () => {
  return (
    <View className="py-4 border-b border-gray-200">
      {menuItems.map((item) => (
        <Pressable key={item.label} onPress={item.onPress}>
          <View className="flex-row items-center px-5 py-3">
            <Ionicons
              name={item.icon}
              size={20}
              color="#111827"
              style={{ marginRight: 12 }}
            />
            <Text className="text-base text-gray-900 font-medium">
              {item.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

