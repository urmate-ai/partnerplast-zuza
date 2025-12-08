import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAITranscriptionService } from './openai-transcription.service';
import { OpenAIResponseService } from './openai-response.service';
import { OpenAIIntentDetectionService } from './openai-intent-detection.service';
import { OpenAIChatTitleService } from './openai-chat-title.service';
import type {
  AudioFile,
  VoiceProcessOptions,
  VoiceProcessResult,
} from '../../types/ai.types';
import type {
  EmailIntentResult,
  CalendarIntentResult,
  SmsIntentResult,
} from '../../types/intent.types';
import type { ChatMessageHistory } from '../../types/chat.types';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly transcriptionService: OpenAITranscriptionService;
  private readonly responseService: OpenAIResponseService;
  private readonly intentDetectionService: OpenAIIntentDetectionService;
  private readonly chatTitleService: OpenAIChatTitleService;

  constructor(
    private readonly configService: ConfigService,
    transcriptionService: OpenAITranscriptionService,
    responseService: OpenAIResponseService,
    intentDetectionService: OpenAIIntentDetectionService,
    chatTitleService: OpenAIChatTitleService,
  ) {
    this.transcriptionService = transcriptionService;
    this.responseService = responseService;
    this.intentDetectionService = intentDetectionService;
    this.chatTitleService = chatTitleService;
  }

  async transcribeAudio(file: AudioFile, language?: string): Promise<string> {
    return this.transcriptionService.transcribe(file, language);
  }

  async generateResponse(
    transcript: string,
    chatHistory: ChatMessageHistory[] = [],
    context?: string,
    location?: string,
    useWebSearch: boolean = false,
    userName?: string,
  ): Promise<string> {
    return this.responseService.generate(
      transcript,
      chatHistory,
      context,
      location,
      useWebSearch,
      userName,
    );
  }

  async detectEmailIntent(transcript: string): Promise<EmailIntentResult> {
    return this.intentDetectionService.detectEmailIntent(transcript);
  }

  async detectCalendarIntent(
    transcript: string,
  ): Promise<CalendarIntentResult> {
    return this.intentDetectionService.detectCalendarIntent(transcript);
  }

  async detectSmsIntent(transcript: string): Promise<SmsIntentResult> {
    return this.intentDetectionService.detectSmsIntent(transcript);
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    return this.chatTitleService.generate(firstMessage);
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
        options.location,
      );
      return { transcript, reply };
    } catch (error) {
      this.logger.error('Failed to process voice input', error as Error);
      throw new InternalServerErrorException('Failed to process voice input');
    }
  }

  async transcribeAndRespondWithHistory(
    file: AudioFile,
    chatHistory: ChatMessageHistory[] = [],
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    try {
      const transcript = await this.transcribeAudio(file, options.language);
      const reply = await this.generateResponse(
        transcript,
        chatHistory,
        options.context,
        options.location,
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
}
