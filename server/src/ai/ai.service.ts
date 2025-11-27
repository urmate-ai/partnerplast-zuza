import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import * as fs from 'node:fs';
import type { Multer } from 'multer';
import { PrismaService } from '../prisma/prisma.service';

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

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is not set – AI features will not work.');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  private formatTimestamp(date: Date | string): string {
    const chatDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - chatDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Teraz';
    } else if (diffHours < 24) {
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

  async saveChat(userId: string, transcript: string, reply: string): Promise<void> {
    try {
      const title = transcript.length > 50 
        ? transcript.substring(0, 50) + '...' 
        : transcript;

      await this.prisma.chat.create({
        data: {
          userId,
          title,
          transcript,
          reply,
        },
      });

      this.logger.log(`Chat saved for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error saving chat to database:', error);
      // Nie rzucamy błędu, aby nie przerwać głównego flow
    }
  }

  async getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit do 100 ostatnich czatów
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });

      return chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        timestamp: this.formatTimestamp(chat.createdAt),
      }));
    } catch (error) {
      this.logger.error('Error fetching chat history:', error);
      return [];
    }
  }

  async searchChats(userId: string, query: string): Promise<ChatHistoryItem[]> {
    try {
      const chats = await this.prisma.chat.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { transcript: { contains: query, mode: 'insensitive' } },
            { reply: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });

      return chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        timestamp: this.formatTimestamp(chat.createdAt),
      }));
    } catch (error) {
      this.logger.error('Error searching chats:', error);
      return [];
    }
  }
}


