import { apiClient } from '../shared/utils/api';
import type { VoiceAiResponse, ChatHistoryItem } from '../shared/types';

export type { VoiceAiResponse, ChatHistoryItem };

export async function sendVoiceToAi(
  uri: string,
  options?: { language?: string; context?: string },
): Promise<VoiceAiResponse> {
  if (!uri) {
    throw new Error('Brak ścieżki do nagrania audio');
  }

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

  try {
    const response = await apiClient.post<VoiceAiResponse>('/ai/voice', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas wysyłania głosu do AI';
    throw new Error(errorMessage);
  }
}

export async function getChatHistory(): Promise<ChatHistoryItem[]> {
  try {
    const response = await apiClient.get<ChatHistoryItem[]>('/ai/chat-history');
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas pobierania historii czatów';
    throw new Error(errorMessage);
  }
}
