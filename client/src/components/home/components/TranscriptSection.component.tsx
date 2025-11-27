import React from 'react';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';

type TranscriptSectionProps = {
  transcript: string;
};

export const TranscriptSection: React.FC<TranscriptSectionProps> = ({
  transcript,
}) => {
  return (
    <View className="w-full">
      <Text variant="caption" className="mb-1">
        Co właśnie mówisz
      </Text>
      <View className="min-h-[56px] rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 justify-center">
        <Text className="text-[15px] text-gray-600">
          {transcript.trim()
            ? transcript
            : 'Transkrypcja Twojej wypowiedzi pojawi się tutaj.'}
        </Text>
      </View>
    </View>
  );
};

