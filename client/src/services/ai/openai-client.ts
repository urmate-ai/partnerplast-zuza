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
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorText;
        console.error(`[OpenAI] API Error ${response.status}:`, errorJson);
      } catch {
        console.error(`[OpenAI] API Error ${response.status}:`, errorText);
      }
      throw new Error(errorMessage || `OpenAI API error: ${response.status}`);
    }

    return response.json();
  }

  async transcribeAudio(audioUri: string, language?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const apiStartTime = performance.now();
    console.log(`[PERF] 🌐 [OpenAI] START Whisper API call | uri: ${audioUri.substring(0, 50)}... | language: ${language || 'auto'} | timestamp: ${new Date().toISOString()}`);

    const formData = new FormData();
    
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    
    formData.append('model', 'gpt-4o-mini-transcribe');
    if (language) {
      formData.append('language', language);
    }
    formData.append('response_format', 'text');

    const networkStartTime = performance.now();
    const result = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });
    
    const networkDuration = performance.now() - networkStartTime;
    console.log(`[PERF] 🌐 [OpenAI] Network response received | status: ${result.status} | network time: ${networkDuration.toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);

    if (!result.ok) {
      const errorText = await result.text().catch(() => 'Unknown error');
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
      }
      const apiDuration = performance.now() - apiStartTime;
      console.log(`[PERF] ❌ [OpenAI] GPT-4o-mini-transcribe API ERROR | duration: ${apiDuration.toFixed(2)}ms | error: ${errorMessage} | timestamp: ${new Date().toISOString()}`);
      throw new Error(errorMessage || `Transcription error: ${result.status}`);
    }

    const responseText = await result.text();
    const apiDuration = performance.now() - apiStartTime;
    console.log(`[PERF] ✅ [OpenAI] END Whisper API call | duration: ${apiDuration.toFixed(2)}ms | network: ${networkDuration.toFixed(2)}ms | processing: ${(apiDuration - networkDuration).toFixed(2)}ms | transcript length: ${responseText.length} | timestamp: ${new Date().toISOString()}`);

    return responseText;
  }

  async chatCompletions(params: {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    max_tokens?: number;
    temperature?: number;
    response_format?: { type: 'json_object' };
    tools?: Array<{ type: string; function?: any }>;
  }): Promise<{ choices: Array<{ message: { content: string } }> }> {
    const apiStartTime = performance.now();
    const messagesCount = params.messages.length;
    const totalChars = params.messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    const estimatedInputTokens = Math.ceil(totalChars / 4);
    
    console.log(`[PERF] 🌐 [OpenAI] START Chat Completions API | model: ${params.model} | messages: ${messagesCount} | estimated input tokens: ~${estimatedInputTokens} | max_tokens: ${params.max_tokens || 'default'} | timestamp: ${new Date().toISOString()}`);
    
    const networkStartTime = performance.now();
    const response = await this.request<{ choices: Array<{ message: { content: string } }> }>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    const networkDuration = performance.now() - networkStartTime;
    const apiDuration = performance.now() - apiStartTime;
    const responseText = response.choices[0]?.message?.content || '';
    const responseLength = responseText.length;
    const estimatedOutputTokens = Math.ceil(responseLength / 4);
    
    console.log(`[PERF] ✅ [OpenAI] END Chat Completions API | duration: ${apiDuration.toFixed(2)}ms | network: ${networkDuration.toFixed(2)}ms | processing: ${(apiDuration - networkDuration).toFixed(2)}ms | input tokens: ~${estimatedInputTokens} | output tokens: ~${estimatedOutputTokens} | response length: ${responseLength} | timestamp: ${new Date().toISOString()}`);
    
    return response;
  }
}

export const openAIClient = new OpenAIClient();

