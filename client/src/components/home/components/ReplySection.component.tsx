import React from 'react';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner.component';
import { ErrorText } from '../../../shared/components/ErrorText.component';
import { Button } from '../../../shared/components/Button.component';

type ReplySectionProps = {
  isLoading: boolean;
  error: string | null;
  reply: string;
  ttsState: { isSpeaking: boolean };
  speak: (text: string) => void;
};

export const ReplySection: React.FC<ReplySectionProps> = ({
  isLoading,
  error,
  reply,
  ttsState,
  speak,
}) => {
  return (
    <View className="mt-4 w-full gap-2">
      <Text variant="caption">Odpowiedź ZUZY</Text>
      
      {isLoading && (
        <View className="flex-row items-center gap-2">
          <LoadingSpinner message="Zuza myśli..." />
        </View>
      )}
      
      {error && !isLoading && <ErrorText message={error} />}
      
      {!isLoading && !error && !!reply && (
        <View className="mt-1 rounded-2xl bg-indigo-50 px-3 py-2">
          <Text className="text-[15px] text-gray-600">{reply}</Text>
        </View>
      )}
      
      <Button
        onPress={() =>
          reply
            ? speak(reply)
            : speak(
                'To jest przykładowa odpowiedź ZUZA. Gdy backend odpowie, usłyszysz tutaj prawdziwą odpowiedź.',
              )
        }
        variant="primary"
        size="md"
        className="self-start"
      >
        {ttsState.isSpeaking ? 'Zatrzymaj mówienie' : 'Odtwórz odpowiedź'}
      </Button>
    </View>
  );
};

