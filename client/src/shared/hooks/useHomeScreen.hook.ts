import { useState } from 'react';
import { useVoiceListener } from '../../hooks/useVoiceListener.hook';
import { useTextToSpeech } from '../../hooks/useTextToSpeech.hook';
import { useVoiceAi } from './useVoiceAi.hook';
import { useAuthStore } from '../../stores/authStore';

export const useHomeScreen = () => {
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [reply, setReply] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const voiceAiMutation = useVoiceAi();
  const { state: ttsState, speak } = useTextToSpeech();

  const [voiceState, startListening, stopListening] = useVoiceListener({
    autoStart: false,
    onStop: async (uri) => {
      if (!uri) return;
      setError(null);
      try {
        const result = await voiceAiMutation.mutateAsync({
          uri,
          options: { language: 'pl' },
        });
        setTranscript(result.transcript);
        setReply(result.reply);
        speak(result.reply);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Coś poszło nie tak po stronie AI.',
        );
      }
    },
  });

  return {
    user,
    isDrawerOpen,
    setIsDrawerOpen,
    voiceState,
    startListening,
    stopListening,
    transcript,
    reply,
    isLoading: voiceAiMutation.isPending,
    error,
    ttsState,
    speak,
  };
};

