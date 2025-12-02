import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { AiService } from './ai.service';
import { VoiceRequestDto } from './dto/voice-request.dto';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';
import type { AudioFile } from './types/ai.types';
import { ElevenLabsTtsService } from './services/tts/elevenlabs-tts.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly elevenLabsTtsService: ElevenLabsTtsService,
  ) {}

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
    const result = await this.aiService.transcribeAndRespond(audio, user.id, {
      language: body.language ?? 'pl',
      context: body.context,
      location: body.location,
    });

    this.aiService
      .saveChat(user.id, result.transcript, result.reply)
      .catch((error: unknown) => {
        if (error instanceof Error) {
          console.error('Failed to save chat:', error.message);
        }
      });

    return {
      transcript: result.transcript,
      reply: result.reply,
      emailIntent: result.emailIntent,
      calendarIntent: result.calendarIntent,
      smsIntent: result.smsIntent,
    };
  }

  @Get('tts')
  async getTts(
    @Query('text') text?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<StreamableFile> {
    const trimmed = text?.trim();
    if (!trimmed) {
      throw new BadRequestException('Query parameter "text" is required.');
    }

    const audioBuffer =
      await this.elevenLabsTtsService.synthesizeToBuffer(trimmed);

    if (!audioBuffer.length) {
      throw new BadRequestException('Failed to synthesize speech.');
    }

    if (res) {
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
      });
    }

    return new StreamableFile(audioBuffer, {
      type: 'audio/mpeg',
    });
  }

  @Get('chat-history')
  @UseGuards(AuthGuard('jwt'))
  async getChatHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.aiService.getChatHistory(user.id);
  }

  @Get('chats')
  @UseGuards(AuthGuard('jwt'))
  async searchChats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
  ) {
    if (search && search.trim()) {
      return this.aiService.searchChats(user.id, search.trim());
    }
    return this.aiService.getChatHistory(user.id);
  }

  @Get('chats/:id')
  @UseGuards(AuthGuard('jwt'))
  async getChatById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') chatId: string,
  ) {
    return this.aiService.getChatById(chatId, user.id);
  }

  @Post('chats/new')
  @UseGuards(AuthGuard('jwt'))
  async createNewChat(@CurrentUser() user: CurrentUserPayload) {
    return this.aiService.createNewChat(user.id);
  }
}
