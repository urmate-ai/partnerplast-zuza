import React from 'react';
import { Pressable } from 'react-native';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { ListeningIndicator } from '../ListeningIndicator.component';

type VoiceControlProps = {
  isListening: boolean;
  onPress: () => void;
};

export const VoiceControl: React.FC<VoiceControlProps> = ({
  isListening,
  onPress,
}) => {
  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5">
        <ListeningIndicator isListening={isListening} />
        <Text className="ml-3 text-base text-gray-600">
          {isListening
            ? 'Słucham... dotknij, aby zakończyć'
            : 'Dotknij, aby zacząć mówić'}
        </Text>
      </View>
    </Pressable>
  );
};

