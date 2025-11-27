import React from 'react';
import { Pressable } from 'react-native';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type DrawerUserInfoProps = {
  userName: string;
};

export const DrawerUserInfo: React.FC<DrawerUserInfoProps> = ({ userName }) => {
  const initials = userName
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-gray-700 border-t border-gray-600">
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 rounded-full bg-gray-900 items-center justify-center mr-3">
          <Text className="text-sm font-semibold text-white">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-white mb-0.5">
            {userName}
          </Text>
          <Text className="text-xs text-gray-400">Free</Text>
        </View>
      </View>
      <Pressable>
        <View className="px-3 py-1.5 rounded-md bg-gray-600 border border-gray-500">
          <Text className="text-xs font-medium text-white">Rozszerz</Text>
        </View>
      </Pressable>
    </View>
  );
};

