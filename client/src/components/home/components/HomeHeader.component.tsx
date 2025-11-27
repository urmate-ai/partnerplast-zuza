import React from 'react';
import { Pressable } from 'react-native';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';
import { MenuButton } from '../../MenuButton.component';

type HomeHeaderProps = {
  onMenuPress: () => void;
  onLogout: () => void;
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onMenuPress,
  onLogout,
}) => {
  return (
    <View className="flex-row items-center justify-between mb-8">
      <MenuButton onPress={onMenuPress} />
      <Pressable onPress={onLogout}>
        <View className="px-4 py-2 rounded-lg bg-gray-100">
          <Text className="text-sm text-gray-900 font-medium">Wyloguj</Text>
        </View>
      </Pressable>
    </View>
  );
};

