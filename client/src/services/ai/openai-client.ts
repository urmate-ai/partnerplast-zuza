import { getOpenAIApiKey, OPENAI_API_BASE } from './openai-config';

export class OpenAIClient {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = getOpenAIApiKey();
    if (!this.apiKey) {
      console.warn('[OpenAI] API key not configured');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch(`${OPENAI_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `OpenAI API error: ${response.status}`);
    }

    return response.json();
  }

  async transcribeAudio(audioUri: string, language?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const formData = new FormData();
    
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    
    formData.append('model', 'whisper-1');
    if (language) {
      formData.append('language', language);
    }
    formData.append('response_format', 'text');

    const result = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!result.ok) {
      const errorText = await result.text().catch(() => 'Unknown error');
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
      }
      throw new Error(errorMessage || `Transcription error: ${result.status}`);
    }

    return result.text();
  }

  async chatCompletions(params: {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    max_tokens?: number;
    temperature?: number;
    response_format?: { type: 'json_object' };
    tools?: Array<{ type: string; function?: any }>;
  }): Promise<{ choices: Array<{ message: { content: string } }> }> {
    return this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const openAIClient = new OpenAIClient();

