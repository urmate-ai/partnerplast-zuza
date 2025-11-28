import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import * as fs from 'node:fs';
import { PromptUtils } from '../utils/prompt.utils';
import type { AudioFile } from '../types/ai.types';
import type {
  VoiceProcessOptions,
  VoiceProcessResult,
} from '../types/ai.types';

interface OpenAIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfig;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – AI features will not work.',
      );
    }

    this.openai = new OpenAI({ apiKey });
    this.config = {
      model: 'gpt-4o-mini',
      maxTokens: 500,
      temperature: 0.7,
    };
  }

  async transcribeAudio(file: AudioFile, language?: string): Promise<string> {
    if (!file?.path) {
      throw new InternalServerErrorException('Audio file path is missing');
    }

    const filePath: string = file.path as string;
    const originalName: string =
      (file.originalname as string | undefined) || 'audio.m4a';

    try {
      const audioBuffer = fs.readFileSync(filePath);
      const openAiFile = await toFile(audioBuffer, originalName);

      const transcription = await this.openai.audio.transcriptions.create({
        file: openAiFile,
        model: 'whisper-1',
        language,
        response_format: 'text',
      });

      const transcript =
        typeof transcription === 'string'
          ? transcription
          : String(transcription);

      if (!transcript) {
        throw new InternalServerErrorException('Empty transcription result');
      }

      return transcript;
    } finally {
      if (file?.path) {
        this.cleanupFile(String(file.path));
      }
    }
  }

  async generateResponse(
    transcript: string,
    chatHistory: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }> = [],
    context?: string,
  ): Promise<string> {
    const systemPrompt = context ?? PromptUtils.DEFAULT_SYSTEM_PROMPT;
    const messages = PromptUtils.buildMessages(
      systemPrompt,
      chatHistory,
      transcript,
    );

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
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
      const reply = await this.generateResponse(
        transcript,
        [],
        options.context,
      );
      return { transcript, reply };
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
      const reply = await this.generateResponse(
        transcript,
        chatHistory,
        options.context,
      );
      return { transcript, reply };
    } catch (error) {
      this.logger.error(
        'Failed to process voice input with history',
        error as Error,
      );
      throw new InternalServerErrorException('Failed to process voice input');
    }
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const prompt = PromptUtils.generateTitlePrompt(firstMessage);

      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: PromptUtils.TITLE_GENERATION_SYSTEM_PROMPT,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 30,
        temperature: this.config.temperature,
      });

      const title =
        completion.choices[0]?.message?.content?.trim() ?? 'Nowa rozmowa';
      return title.length > 60 ? title.substring(0, 60) : title;
    } catch (error) {
      this.logger.error('Error generating chat title:', error);
      return 'Nowa rozmowa';
    }
  }

  private cleanupFile(filePath: string | undefined): void {
    if (filePath) {
      fs.unlink(filePath, () => undefined);
    }
  }
}
