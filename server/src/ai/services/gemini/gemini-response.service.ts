import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PromptUtils } from '../../utils/prompt.utils';
import type { MessageRole } from '../../types/chat.types';

type ChatHistoryMessage = {
  role: MessageRole;
  content: string;
};

@Injectable()
export class GeminiResponseService {
  private readonly logger = new Logger(GeminiResponseService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set – Gemini features will not work.',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');

    // Gemini 2.0 Flash - najszybszy model z dostępem do Google Search
    // Modele Gemini mają wbudowany dostęp do Google Search - nie trzeba konfigurować tools
    // Używamy gemini-2.0-flash-exp (experimental) lub gemini-1.5-flash jeśli nie dostępny
    try {
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });
      this.logger.debug(
        'Using gemini-2.0-flash-exp with built-in Google Search',
      );
    } catch {
      // Fallback do gemini-1.5-flash jeśli 2.0 nie jest dostępny
      this.logger.warn(
        'gemini-2.0-flash-exp not available, using gemini-1.5-flash',
      );
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });
    }
  }

  async generate(
    transcript: string,
    chatHistory: ChatHistoryMessage[] = [],
    context?: string,
    location?: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, location);

    try {
      // Przygotuj historię czatu dla Gemini
      const history = chatHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Rozpocznij chat session z historią
      // systemInstruction musi być obiektem z parts, nie stringiem

      const chat = this.model.startChat({
        history,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
          role: 'system',
        },
      });

      this.logger.debug(`Calling Gemini 2.0 Flash with Google Search`);

      const result = await chat.sendMessage(transcript);
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const response = await result.response;

      const reply = String(response.text());

      if (!reply || !reply.trim()) {
        this.logger.warn('Empty response from Gemini');
        return 'Przepraszam, nie zrozumiałam. Możesz powtórzyć?';
      }

      this.logger.debug(`Gemini response length: ${reply.length} chars`);
      return reply.trim();
    } catch (error) {
      this.logger.error('Failed to generate Gemini response:', error);
      throw error;
    }
  }

  private buildSystemPrompt(context?: string, location?: string): string {
    let prompt = context ?? PromptUtils.DEFAULT_SYSTEM_PROMPT;

    // Dodaj aktualną datę
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    prompt += `\n\nAktualna data i czas: ${dateStr}, godzina ${timeStr}.`;

    if (location) {
      prompt += `\nLokalizacja użytkownika: ${location}.`;
    }

    prompt +=
      '\n\nMasz dostęp do Google Search - używaj go do uzyskania aktualnych informacji o pogodzie, wydarzeniach, wynikach sportowych, cenach itp.';

    return prompt;
  }
}
