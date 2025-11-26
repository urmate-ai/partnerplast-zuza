const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type VoiceAiResponse = {
  transcript: string;
  reply: string;
};

export async function sendVoiceToAi(
  uri: string,
  options?: { language?: string; context?: string },
): Promise<VoiceAiResponse> {
  const fileUri = uri;
  if (!fileUri) {
    throw new Error('Brak ścieżki do nagrania audio');
  }

  const form = new FormData();

  form.append('audio', {
    uri: fileUri,
    name: 'voice.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  if (options?.language) {
    form.append('language', options.language);
  }
  if (options?.context) {
    form.append('context', options.context);
  }

  const response = await fetch(`${API_URL}/ai/voice`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Błąd API (${response.status}): ${text || response.statusText}`,
    );
  }

  const data = (await response.json()) as VoiceAiResponse;
  return data;
}


