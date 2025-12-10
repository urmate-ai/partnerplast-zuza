import { getGeminiApiKey, GEMINI_API_BASE } from './gemini-config';

export class GeminiClient {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = getGeminiApiKey();
    if (!this.apiKey) {
      console.warn('[Gemini] API key not configured');
    }
  }

  async generateContent(params: {
    model: string;
    systemInstruction?: string;
    contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    generationConfig?: {
      maxOutputTokens?: number;
      temperature?: number;
    };
    tools?: Array<{ googleSearch: {} }>;
  }): Promise<{ text: string }> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const apiStartTime = performance.now();
    const inputText = params.contents.map(c => c.parts.map(p => p.text).join('')).join('\n');
    const estimatedInputTokens = Math.ceil(inputText.length / 4);
    
    console.log(`[PERF] 🌐 [Gemini] START Generate Content API | model: ${params.model} | estimated input tokens: ~${estimatedInputTokens} | max_output_tokens: ${params.generationConfig?.maxOutputTokens || 'default'} | timestamp: ${new Date().toISOString()}`);

    const requestBody: any = {
      contents: params.contents,
      generationConfig: params.generationConfig,
    };

    if (params.systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: params.systemInstruction }],
      };
    }

    if (params.tools) {
      requestBody.tools = params.tools;
    }

    const networkStartTime = performance.now();
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${params.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const networkDuration = performance.now() - networkStartTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorText;
        console.error(`[Gemini] API Error ${response.status}:`, errorJson);
      } catch {
        console.error(`[Gemini] API Error ${response.status}:`, errorText);
      }
      throw new Error(errorMessage || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const apiDuration = performance.now() - apiStartTime;

    // Wyodrębnij tekst z odpowiedzi Gemini
    let responseText = '';
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        responseText = candidate.content.parts
          .map((part: any) => part.text || '')
          .join('');
      }
    }

    const responseLength = responseText.length;
    const estimatedOutputTokens = Math.ceil(responseLength / 4);

    console.log(`[PERF] ✅ [Gemini] END Generate Content API | duration: ${apiDuration.toFixed(2)}ms | network: ${networkDuration.toFixed(2)}ms | processing: ${(apiDuration - networkDuration).toFixed(2)}ms | input tokens: ~${estimatedInputTokens} | output tokens: ~${estimatedOutputTokens} | response length: ${responseLength} | timestamp: ${new Date().toISOString()}`);

    return { text: responseText };
  }
}

export const geminiClient = new GeminiClient();

