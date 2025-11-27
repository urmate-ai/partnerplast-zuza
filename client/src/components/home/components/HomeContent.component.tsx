import React from 'react';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';

type HomeContentProps = {
  userName?: string;
};

export const HomeContent: React.FC<HomeContentProps> = ({ userName }) => {
  return (
    <View className="flex-1 items-center justify-center gap-2">
      <Text variant="body" className="text-center text-gray-500">
        Cześć {userName}! Jestem Zuza, Twój asystent AI
      </Text>
      <Text variant="h1" className="text-center">
        Jestem gotowa do działania.
      </Text>
    </View>
  );
};

