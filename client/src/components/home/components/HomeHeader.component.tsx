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
      <Text className="text-sm text-gray-900 font-medium">Zuza</Text>
    </View>
  );
};

