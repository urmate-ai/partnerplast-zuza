import { useMutation } from '@tanstack/react-query';
import { transcribeAndRespond } from '../../../services/ai/voice-ai.service';
import type { VoiceProcessResult } from '../../../shared/types/ai.types';
import { useAuthStore } from '../../../stores/authStore';

type SendVoiceToAiOptions = {
  language?: string;
  context?: string;
  location?: string;
};

const sendVoiceToAiRequest = async (
  uri: string,
  options?: SendVoiceToAiOptions,
): Promise<VoiceProcessResult> => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  return transcribeAndRespond(uri, userId, options);
};

export const useVoiceAi = () => {
  return useMutation({
    mutationFn: ({ uri, options }: { uri: string; options?: SendVoiceToAiOptions }) =>
      sendVoiceToAiRequest(uri, options),
  });
};

