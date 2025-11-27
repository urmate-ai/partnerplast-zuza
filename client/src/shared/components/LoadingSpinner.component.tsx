import React from 'react';
import { ActivityIndicator } from 'react-native';
import { View } from './View.component';
import { Text } from './Text.component';

type LoadingSpinnerProps = {
  message?: string;
  size?: 'small' | 'large';
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'small',
}) => {
  return (
    <View className="flex-row items-center gap-2">
      <ActivityIndicator size={size} color="#6B7280" />
      {message && <Text variant="caption">{message}</Text>}
    </View>
  );
};

