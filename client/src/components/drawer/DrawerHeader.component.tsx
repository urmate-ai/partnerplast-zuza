import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type DrawerHeaderProps = {
  onClose: () => void;
};

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ onClose }) => {
  return (
    <View className="flex-row items-center justify-between px-5 pt-14 pb-4">
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-gray-900 items-center justify-center">
          <Text className="text-lg font-bold text-white">Z</Text>
        </View>
      </View>
      <Pressable onPress={onClose}>
        <View className="w-8 h-8 items-center justify-center">
          <Ionicons name="close" size={24} color="#6B7280" />
        </View>
      </Pressable>
    </View>
  );
};

