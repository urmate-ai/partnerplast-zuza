import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
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

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
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

  async transcribeAndRespond(
    file: Multer.File,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    if (!file?.path) {
      throw new InternalServerErrorException('Audio file path is missing');
    }

    const { language, context } = options;

    try {
      const audioStream = fs.createReadStream(file.path);

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioStream as any,
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
}


