import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { Multer } from 'multer';
import { diskStorage } from 'multer';
import { AiService } from './ai.service';
import { VoiceRequestDto } from './dto/voice-request.dto';

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
    @UploadedFile() audio: Multer.File,
    @Body() body: VoiceRequestDto,
    @Request() req: any,
  ) {
    const result = await this.aiService.transcribeAndRespond(audio, {
      language: body.language ?? 'pl',
      context: body.context,
    });

    this.aiService.saveChat(req.user.id, result.transcript, result.reply).catch((error) => {
      console.error('Failed to save chat:', error);
    });

    return {
      transcript: result.transcript,
      reply: result.reply,
    };
  }

  @Get('chat-history')
  @UseGuards(AuthGuard('jwt'))
  async getChatHistory(@Request() req: any) {
    return this.aiService.getChatHistory(req.user.id);
  }

  @Get('chats')
  @UseGuards(AuthGuard('jwt'))
  async searchChats(@Request() req: any, @Query('search') search?: string) {
    if (search && search.trim()) {
      return this.aiService.searchChats(req.user.id, search.trim());
    }
    return this.aiService.getChatHistory(req.user.id);
  }
}


