import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from './View.component';
import { Text } from './Text.component';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBack,
  rightElement,
  className = '',
}) => {
  return (
    <View className={`pt-14 px-6 pb-4 border-b border-gray-200 ${className}`}>
      <View className="flex-row items-center justify-between mb-4">
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
        <Text variant="h1" className="flex-1 text-center">
          {title}
        </Text>
        {rightElement || <View className="w-10" />}
      </View>
    </View>
  );
};

