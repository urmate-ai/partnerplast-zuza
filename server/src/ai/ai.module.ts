import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { ChatService } from './services/chat/chat.service';
import { OpenAIChatTitleService } from './services/openai/openai-chat-title.service';
import { PrismaModule } from '../prisma/prisma.module';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => AuthModule)],
  controllers: [AiController],
  providers: [
    ChatService,
    {
      provide: OpenAIChatTitleService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAIChatTitleService(apiKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: [ChatService],
})
export class AiModule {}
