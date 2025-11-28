import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View } from './View.component';
import { Text } from './Text.component';

type ErrorStateProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  icon = 'alert-circle-outline',
  className = '',
}) => {
  return (
    <View className={`flex-1 items-center justify-center py-20 px-6 ${className}`}>
      <Ionicons name={icon} size={48} color="#EF4444" />
      <Text className="text-red-500 text-center mt-4">{message}</Text>
    </View>
  );
};

