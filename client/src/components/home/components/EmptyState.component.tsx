import React from 'react';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-gray-400 text-center">
        Rozpocznij rozmowę z Zuza, aby zobaczyć wiadomości tutaj
      </Text>
    </View>
  );
}

