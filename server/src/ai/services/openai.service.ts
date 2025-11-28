import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import * as fs from 'node:fs';
import type { AudioFile } from '../types/ai.types';
import type { VoiceProcessOptions, VoiceProcessResult } from '../types/ai.types';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is not set – AI features will not work.');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  async transcribeAudio(file: AudioFile, language?: string): Promise<string> {
    if (!file?.path) {
      throw new InternalServerErrorException('Audio file path is missing');
    }

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

      const transcript = typeof transcription === 'string' ? transcription : String(transcription);

      if (!transcript) {
        throw new InternalServerErrorException('Empty transcription result');
      }

      return transcript;
    } finally {
      if (file?.path) {
        fs.unlink(file.path, () => undefined);
      }
    }
  }

  async generateResponse(
    transcript: string,
    chatHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
    context?: string,
  ): Promise<string> {
    const systemPrompt =
      context ??
      'Jesteś ZUZA, pomocnym, ciepłym asystentem głosowym AI mówiącym po polsku. Odpowiadaj zwięźle i naturalnie.';

    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.filter((msg) => msg.role !== 'system'),
      { role: 'user', content: transcript },
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? '';

    if (!reply) {
      throw new InternalServerErrorException('Empty AI reply');
    }

    return reply;
  }

  async transcribeAndRespond(
    file: AudioFile,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    try {
      const transcript = await this.transcribeAudio(file, options.language);
      const reply = await this.generateResponse(transcript, [], options.context);

      return {
        transcript,
        reply,
      };
    } catch (error) {
      this.logger.error('Failed to process voice input', error as Error);
      throw new InternalServerErrorException('Failed to process voice input');
    }
  }

  async transcribeAndRespondWithHistory(
    file: AudioFile,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    try {
      const transcript = await this.transcribeAudio(file, options.language);
      const reply = await this.generateResponse(transcript, chatHistory, options.context);

      return {
        transcript,
        reply,
      };
    } catch (error) {
      this.logger.error('Failed to process voice input with history', error as Error);
      throw new InternalServerErrorException('Failed to process voice input');
    }
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const prompt = `Stwórz krótki, zwięzły tytuł (maksymalnie 5-6 słów) dla następującej wiadomości użytkownika. Tytuł powinien być po polsku i opisywać główny temat wiadomości. Odpowiedz tylko tytułem, bez dodatkowych słów.\n\nWiadomość: "${firstMessage}"`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Jesteś asystentem, który tworzy krótkie, zwięzłe tytuły dla wiadomości. Odpowiadaj tylko tytułem, bez dodatkowych słów.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 30,
        temperature: 0.7,
      });

      const title = completion.choices[0]?.message?.content?.trim() ?? 'Nowa rozmowa';
      return title.length > 60 ? title.substring(0, 60) : title;
    } catch (error) {
      this.logger.error('Error generating chat title:', error);
      return 'Nowa rozmowa';
    }
  }
}

