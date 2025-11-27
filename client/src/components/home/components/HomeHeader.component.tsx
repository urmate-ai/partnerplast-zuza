import React from 'react';
import { TouchableOpacity } from 'react-native';
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
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <View className="flex-row items-center justify-between mb-8">
      <MenuButton onPress={onMenuPress} />
      <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
        <View className="px-4 py-2 rounded-lg bg-gray-100">
          <Text className="text-sm text-gray-900 font-medium">Wyloguj</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

