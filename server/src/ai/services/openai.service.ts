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

  async generateResponse(transcript: string, context?: string): Promise<string> {
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
      const reply = await this.generateResponse(transcript, options.context);

      return {
        transcript,
        reply,
      };
    } catch (error) {
      this.logger.error('Failed to process voice input', error as Error);
      throw new InternalServerErrorException('Failed to process voice input');
    }
  }
}

