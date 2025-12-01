import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { OpenAIService } from './services/openai.service';
import { ChatService } from './services/chat.service';
import { OpenAITranscriptionService } from './services/openai-transcription.service';
import { OpenAIResponseService } from './services/openai-response.service';
import { OpenAIIntentDetectionService } from './services/openai-intent-detection.service';
import { OpenAIChatTitleService } from './services/openai-chat-title.service';
import { ResponseCacheService } from './services/response-cache.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import OpenAI from 'openai';
import type { OpenAIConfig, OpenAIResponsesClient } from './types/ai.types';

@Module({
  imports: [ConfigModule, PrismaModule, IntegrationsModule],
  controllers: [AiController],
  providers: [
    AiService,
    ChatService,
    ResponseCacheService,
    {
      provide: OpenAITranscriptionService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAITranscriptionService(apiKey);
      },
      inject: [ConfigService],
    },
    {
      provide: OpenAIIntentDetectionService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAIIntentDetectionService(apiKey);
      },
      inject: [ConfigService],
    },
    {
      provide: OpenAIChatTitleService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAIChatTitleService(apiKey);
      },
      inject: [ConfigService],
    },
    {
      provide: OpenAIResponseService,
      useFactory: (
        configService: ConfigService,
        cacheService: ResponseCacheService,
      ) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        const openai = new OpenAI({ apiKey });
        const responsesClient = (
          openai as unknown as { responses: OpenAIResponsesClient }
        ).responses;

        const config: OpenAIConfig = {
          model: 'gpt-5',
          maxTokens: 500,
          temperature: 0.7,
        };

        return new OpenAIResponseService(responsesClient, config, cacheService);
      },
      inject: [ConfigService, ResponseCacheService],
    },
    {
      provide: OpenAIService,
      useFactory: (
        configService: ConfigService,
        transcriptionService: OpenAITranscriptionService,
        responseService: OpenAIResponseService,
        intentDetectionService: OpenAIIntentDetectionService,
        chatTitleService: OpenAIChatTitleService,
      ) => {
        return new OpenAIService(
          configService,
          transcriptionService,
          responseService,
          intentDetectionService,
          chatTitleService,
        );
      },
      inject: [
        ConfigService,
        OpenAITranscriptionService,
        OpenAIResponseService,
        OpenAIIntentDetectionService,
        OpenAIChatTitleService,
      ],
    },
  ],
  exports: [AiService, ChatService, OpenAIService],
})
export class AiModule {}
