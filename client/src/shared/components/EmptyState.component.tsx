import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View } from './View.component';
import { Text } from './Text.component';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  className?: string;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'chatbubbles-outline',
  title,
  description,
  className = '',
}) => {
  return (
    <View className={`flex-1 items-center justify-center py-20 px-6 ${className}`}>
      <Ionicons name={icon} size={48} color="#9CA3AF" />
      <Text className="text-gray-500 text-center mt-4">{title}</Text>
      {description && (
        <Text className="text-gray-400 text-center mt-2 text-sm">{description}</Text>
      )}
    </View>
  );
};

