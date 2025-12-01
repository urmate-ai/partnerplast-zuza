import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../utils/api';
import type { VoiceAiResponse } from '../../../shared/types';

type SendVoiceToAiOptions = {
  language?: string;
  context?: string;
  location?: string;
};

const sendVoiceToAiRequest = async (
  uri: string,
  options?: SendVoiceToAiOptions,
): Promise<VoiceAiResponse> => {
  const form = new FormData();
  form.append('audio', {
    uri: uri,
    name: 'voice.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  if (options?.language) {
    form.append('language', options.language);
  }
  if (options?.context) {
    form.append('context', options.context);
  }
  if (options?.location) {
    form.append('location', options.location);
  }

  const response = await apiClient.post<VoiceAiResponse>('/ai/voice', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const useVoiceAi = () => {
  return useMutation({
    mutationFn: ({ uri, options }: { uri: string; options?: SendVoiceToAiOptions }) =>
      sendVoiceToAiRequest(uri, options),
  });
};

