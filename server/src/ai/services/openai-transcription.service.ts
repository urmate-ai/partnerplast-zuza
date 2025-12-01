import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import OpenAI, { toFile } from 'openai';
import * as fs from 'node:fs';
import type { AudioFile } from '../types/ai.types';
import type { AudioFileInput, AudioFileWithPath } from '../types/file.types';

@Injectable()
export class OpenAITranscriptionService {
  private readonly logger = new Logger(OpenAITranscriptionService.name);
  private readonly openai: OpenAI;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – transcription features will not work.',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  async transcribe(file: AudioFile, language?: string): Promise<string> {
    const validatedFile = this.validateAndExtractFile(file);
    const filePath = validatedFile.path;
    const originalName = validatedFile.originalname || 'audio.m4a';

    try {
      const audioBuffer = fs.readFileSync(filePath);
      const openAiFile = await toFile(audioBuffer, originalName);

      const transcription = await this.openai.audio.transcriptions.create({
        file: openAiFile,
        model: 'whisper-1',
        language,
        response_format: 'text',
      });

      const transcript = this.extractTranscript(transcription);

      if (!transcript) {
        throw new InternalServerErrorException('Empty transcription result');
      }

      return transcript;
    } finally {
      this.cleanupFile(filePath);
    }
  }

  private validateAndExtractFile(file: unknown): AudioFileWithPath {
    if (!file || typeof file !== 'object') {
      throw new InternalServerErrorException('Audio file is missing');
    }

    const fileInput = file as AudioFileInput;
    const path = fileInput.path;

    if (!path || typeof path !== 'string') {
      throw new InternalServerErrorException('Audio file path is missing');
    }

    return {
      path,
      originalname:
        fileInput.originalname && typeof fileInput.originalname === 'string'
          ? fileInput.originalname
          : undefined,
    };
  }

  private extractTranscript(transcription: unknown): string {
    if (typeof transcription === 'string') {
      return transcription;
    }
    return String(transcription);
  }

  private cleanupFile(filePath: string | undefined): void {
    if (!filePath) {
      return;
    }

    fs.unlink(filePath, (error) => {
      if (error) {
        this.logger.warn(`Failed to cleanup file: ${filePath}`, error);
      }
    });
  }
}
