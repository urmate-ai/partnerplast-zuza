import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { OpenAIService } from './services/openai.service';
import { ChatService } from './services/chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [ConfigModule, PrismaModule, IntegrationsModule],
  controllers: [AiController],
  providers: [AiService, OpenAIService, ChatService],
  exports: [AiService, ChatService],
})
export class AiModule {}
