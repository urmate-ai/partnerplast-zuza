import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { AiService } from './ai.service';
import { VoiceRequestDto } from './dto/voice-request.dto';
import { CurrentUser, type CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import type { AudioFile } from './types/ai.types';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('voice')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: '/tmp',
      }),
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  async handleVoice(
    @UploadedFile() audio: AudioFile,
    @Body() body: VoiceRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.aiService.transcribeAndRespond(audio, {
      language: body.language ?? 'pl',
      context: body.context,
    });

    this.aiService.saveChat(user.id, result.transcript, result.reply).catch((error) => {
      console.error('Failed to save chat:', error);
    });

    return {
      transcript: result.transcript,
      reply: result.reply,
    };
  }

  @Get('chat-history')
  @UseGuards(AuthGuard('jwt'))
  async getChatHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.aiService.getChatHistory(user.id);
  }

  @Get('chats')
  @UseGuards(AuthGuard('jwt'))
  async searchChats(@CurrentUser() user: CurrentUserPayload, @Query('search') search?: string) {
    if (search && search.trim()) {
      return this.aiService.searchChats(user.id, search.trim());
    }
    return this.aiService.getChatHistory(user.id);
  }
}


