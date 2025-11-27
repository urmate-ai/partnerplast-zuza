import React from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type DrawerMenuItemsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
};

type DrawerMenuItemsProps = {
  onClose?: () => void;
};

export const DrawerMenuItems: React.FC<DrawerMenuItemsProps> = ({
  onClose,
}) => {
  const navigation = useNavigation<DrawerMenuItemsNavigationProp>();

  const menuItems: MenuItem[] = [
    { icon: 'create-outline', label: 'Nowy czat' },
    { icon: 'search-outline', label: 'Wyszukaj czaty' },
    { icon: 'link-outline', label: 'Integracje' },
    {
      icon: 'settings-outline',
      label: 'Ustawienia',
      onPress: () => {
        onClose?.();
        navigation.navigate('Settings');
      },
    },
  ];

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

