import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import * as fs from 'node:fs';
import type { Multer } from 'multer';

type VoiceProcessOptions = {
  language?: string;
  context?: string;
};

export type VoiceProcessResult = {
  transcript: string;
  reply: string;
};

type ChatHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private chatHistory: ChatHistoryItem[] = [];

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is not set – AI features will not work.');
    }

    this.openai = new OpenAI({
      apiKey,
    });

    // Inicjalizacja przykładowej historii czatów (tymczasowo bez bazy danych)
    this.initializeMockChatHistory();
  }

  private initializeMockChatHistory() {
    const now = new Date();
    this.chatHistory = [
      {
        id: '1',
        title: 'Typy w Javie',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      },
      {
        id: '2',
        title: 'Praca w IT 2025',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      },
      {
        id: '3',
        title: 'Translate video link',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '4',
        title: 'MVP zarządzania zadaniami',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '5',
        title: 'Ukraina a Putin',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '6',
        title: 'MVP integracja z HubSpot',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '7',
        title: 'Szybkość myślenia AI',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '8',
        title: 'Profil juniora front-end developera',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '9',
        title: 'Integracja Notion w MVP',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '10',
        title: 'MVP Gmail odczyt wiadomości',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '11',
        title: 'Pensja fullstack studenta',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)),
      },
      {
        id: '12',
        title: 'Bot do WhatsAppa technologie',
        timestamp: this.formatTimestamp(new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000)),
      },
    ];
  }

  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return 'Dzisiaj';
    } else if (diffDays === 1) {
      return 'Wczoraj';
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 'Tydzień temu' : `${weeks} tygodnie temu`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? 'Miesiąc temu' : `${months} miesiące temu`;
    }
  }

  async transcribeAndRespond(
    file: Multer.File,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    if (!file?.path) {
      throw new InternalServerErrorException('Audio file path is missing');
    }

    const { language, context } = options;

    try {
      const audioBuffer = fs.readFileSync(file.path);
      const openAiFile = await toFile(
        audioBuffer,
        file.originalname || 'audio.m4a',
      );

      const transcription = await this.openai.audio.transcriptions.create({
        file: openAiFile,
        model: 'whisper-1',
        language,
        response_format: 'text',
      });

      const transcript =
        typeof transcription === 'string'
          ? transcription
          : (transcription as any).text ?? '';

      if (!transcript) {
        throw new InternalServerErrorException('Empty transcription result');
      }

      const systemPrompt =
        context ??
        'Jesteś ZUZA, pomocnym, ciepłym asystentem głosowym AI mówiącym po polsku. Odpowiadaj zwięźle i naturalnie.';

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
      });

      const reply =
        completion.choices[0]?.message?.content?.toString().trim() ?? '';

      if (!reply) {
        throw new InternalServerErrorException('Empty AI reply');
      }

      // Dodaj do historii czatów (tylko pierwsze 50 znaków jako tytuł)
      this.addToChatHistory(transcript);

      return {
        transcript,
        reply,
      };
    } catch (error) {
      this.logger.error('Failed to process voice input', error as Error);
      throw new InternalServerErrorException('Failed to process voice input');
    } finally {
      if (file?.path) {
        fs.unlink(file.path, () => undefined);
      }
    }
  }

  getChatHistory(): ChatHistoryItem[] {
    return this.chatHistory;
  }

  private addToChatHistory(transcript: string) {
    const title = transcript.length > 50 
      ? transcript.substring(0, 50) + '...' 
      : transcript;
    
    const newChat: ChatHistoryItem = {
      id: Date.now().toString(),
      title,
      timestamp: 'Teraz',
    };

    // Dodaj na początek listy
    this.chatHistory.unshift(newChat);

    // Ogranicz do 20 ostatnich czatów
    if (this.chatHistory.length > 20) {
      this.chatHistory = this.chatHistory.slice(0, 20);
    }
  }
}


