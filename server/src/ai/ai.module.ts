import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { OpenAIService } from './services/openai/openai.service';
import { OpenAIFastResponseService } from './services/openai/openai-fast-response.service';
import { ChatService } from './services/chat/chat.service';
import { OpenAITranscriptionService } from './services/openai/openai-transcription.service';
import { OpenAIResponseService } from './services/openai/openai-response.service';
import { OpenAIIntentDetectionService } from './services/openai/openai-intent-detection.service';
import { OpenAIChatTitleService } from './services/openai/openai-chat-title.service';
import { ResponseCacheService } from './services/cache/response-cache.service';
import { IntegrationStatusCacheService } from './services/cache/integration-status-cache.service';
import { IntentClassifierService } from './services/intent/intent-classifier.service';
import { AIIntentClassifierService } from './services/intent/ai-intent-classifier.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import OpenAI from 'openai';
import type { OpenAIConfig, OpenAIResponsesClient } from './types/ai.types';
import { ElevenLabsTtsService } from './services/tts/elevenlabs-tts.service';
import { GooglePlacesService } from './services/places/google-places.service';
import { OpenAIPlacesResponseService } from './services/openai/openai-places-response.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    IntegrationsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    ElevenLabsTtsService,
    ChatService,
    IntentClassifierService,
    {
      provide: AIIntentClassifierService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new AIIntentClassifierService(apiKey);
      },
      inject: [ConfigService],
    },
    GooglePlacesService,
    {
      provide: ResponseCacheService,
      useFactory: () => new ResponseCacheService(),
    },
    {
      provide: IntegrationStatusCacheService,
      useFactory: () => {
        const service = new IntegrationStatusCacheService();
        setInterval(() => service.cleanup(), 10 * 60 * 1000);
        return service;
      },
    },
    {
      provide: OpenAIFastResponseService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAIFastResponseService(apiKey);
      },
      inject: [ConfigService],
    },
    {
      provide: OpenAIPlacesResponseService,
      useFactory: (
        configService: ConfigService,
        placesService: GooglePlacesService,
      ) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAIPlacesResponseService(apiKey, placesService);
      },
      inject: [ConfigService, GooglePlacesService],
    },
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
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 500,
        };

        return new OpenAIResponseService(
          responsesClient,
          config,
          cacheService,
          openai,
        );
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
