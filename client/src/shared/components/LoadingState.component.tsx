import React from 'react';
import { ActivityIndicator } from 'react-native';
import { View } from './View.component';
import { Text } from './Text.component';

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Ładowanie...',
  className = '',
}) => {
  return (
    <View className={`flex-1 items-center justify-center py-20 ${className}`}>
      <ActivityIndicator size="large" color="#111827" />
      {message && <Text className="text-gray-500 mt-4">{message}</Text>}
    </View>
  );
};

