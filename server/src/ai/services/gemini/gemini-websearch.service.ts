import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleGenerativeAI, Tool } from '@google/generative-ai';
import { PromptUtils } from '../../utils/prompt.utils';
import { ResponseCacheService } from '../cache/response-cache.service';
import type { MessageRole } from '../../types/chat.types';

type ChatHistoryMessage = {
  role: MessageRole;
  content: string;
};

@Injectable()
export class GeminiWebSearchService {
  private readonly logger = new Logger(GeminiWebSearchService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly cacheService: ResponseCacheService;
  private readonly modelName = 'gemini-2.5-pro';

  constructor(apiKey: string, cacheService: ResponseCacheService) {
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GOOGLE_AI_API_KEY is not configured',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.cacheService = cacheService;
  }

  async generateWithWebSearch(
    transcript: string,
    chatHistory: ChatHistoryMessage[] = [],
    context?: string,
    location?: string,
    userName?: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, location, userName);

    const cacheKey = this.buildCacheKey(systemPrompt, chatHistory, transcript);
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      this.logger.debug('Returning cached response for web search query');
      return cached;
    }

    try {
      this.logger.debug(
        `Using Gemini 2.5 Pro with Google Search retrieval for web search query`,
      );

      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 500,
        },
        tools: [
          {
            googleSearch: {},
          } as unknown as Tool,
        ],
      });

      const fullPrompt = this.buildFullPrompt(
        systemPrompt,
        chatHistory,
        transcript,
      );

      this.logger.debug(
        `Sending prompt to Gemini (length: ${fullPrompt.length})`,
      );

      const result = await model.generateContent(fullPrompt);
      const response = result.response;

      this.logger.debug(
        'Gemini response:',
        JSON.stringify({
          candidates: response.candidates?.length,
          finishReason: response.candidates?.[0]?.finishReason,
          hasText: !!response.text(),
        }),
      );

      const text = response.text();

      if (!text || !text.trim()) {
        this.logger.error(
          'Empty response from Gemini. Full response:',
          JSON.stringify(response, null, 2),
        );
        throw new InternalServerErrorException(
          'Przepraszam, nie udało mi się wygenerować odpowiedzi na to pytanie.',
        );
      }

      const finalReply = this.postprocessReply(text);
      this.cacheService.set(cacheKey, finalReply);
      return finalReply;
    } catch (error) {
      this.logger.error('Failed to generate response with Gemini:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('API_KEY_INVALID') ||
          error.message.includes('401')
        ) {
          throw new InternalServerErrorException(
            'Błąd autoryzacji z Gemini API. Sprawdź konfigurację GOOGLE_AI_API_KEY.',
          );
        }
        if (error.message.includes('429') || error.message.includes('quota')) {
          throw new InternalServerErrorException(
            'Przekroczono limit zapytań do Gemini. Spróbuj ponownie za chwilę.',
          );
        }
        if (
          error.message.includes('Connection error') ||
          error.message.includes('ECONNREFUSED')
        ) {
          throw new InternalServerErrorException(
            'Nie można połączyć się z Gemini API. Sprawdź połączenie internetowe.',
          );
        }
      }

      throw new InternalServerErrorException(
        `Błąd podczas generowania odpowiedzi: ${error instanceof Error ? error.message : 'Nieznany błąd'}`,
      );
    }
  }

  private buildSystemPrompt(
    context?: string,
    location?: string,
    userName?: string,
  ): string {
    const basePrompt = context ?? PromptUtils.buildSystemPrompt(userName);
    if (!location) {
      return basePrompt;
    }
    return `${basePrompt} Aktualna (przybliżona) lokalizacja użytkownika: ${location}.`;
  }

  private buildFullPrompt(
    systemPrompt: string,
    chatHistory: ChatHistoryMessage[],
    userMessage: string,
  ): string {
    const parts: string[] = [];

    if (systemPrompt) {
      parts.push(`Instrukcje: ${systemPrompt}\n\n`);
    }

    if (chatHistory.length > 0) {
      parts.push('Historia rozmowy:\n');
      for (const msg of chatHistory) {
        if (msg.role === 'system') continue;
        const roleLabel = msg.role === 'user' ? 'Użytkownik' : 'ZUZA';
        parts.push(`${roleLabel}: ${msg.content}\n`);
      }
      parts.push('\n');
    }

    parts.push(`Pytanie użytkownika: ${userMessage}`);

    return parts.join('');
  }

  private convertHistoryToGeminiFormat(
    chatHistory: ChatHistoryMessage[],
    systemPrompt: string,
  ): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    const history: Array<{
      role: 'user' | 'model';
      parts: Array<{ text: string }>;
    }> = [];

    if (systemPrompt) {
      history.push({
        role: 'user',
        parts: [{ text: systemPrompt }],
      });
      history.push({
        role: 'model',
        parts: [
          { text: 'Rozumiem. Jestem ZUZA, pomocnym asystentem głosowym AI.' },
        ],
      });
    }

    for (const msg of chatHistory) {
      if (msg.role === 'system') {
        continue;
      }

      if (msg.role === 'user') {
        history.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        history.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    return history;
  }

  private buildCacheKey(
    systemPrompt: string,
    chatHistory: ChatHistoryMessage[],
    transcript: string,
  ): string {
    return JSON.stringify({
      provider: 'gemini',
      systemPrompt,
      chatHistory,
      transcript,
      webSearch: true,
    });
  }

  private postprocessReply(reply: string): string {
    let processed = reply.trim();

    processed = processed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    processed = processed.replace(/\*\*([^*]+)\*\*/g, '$1');
    processed = processed.replace(/\*([^*]+)\*/g, '$1');

    processed = processed.replace(/https?:\/\/[^\s]+/g, '');

    processed = processed.replace(/\s+/g, ' ').trim();

    const sentences = processed.split(/[.!?]+/).filter((s) => s.trim());
    if (sentences.length > 2) {
      processed = sentences.slice(0, 2).join('. ').trim() + '.';
    }

    return processed;
  }
}
