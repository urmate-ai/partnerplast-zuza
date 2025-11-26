import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';
import { diskStorage } from 'multer';
import { AiService } from './ai.service';
import { VoiceRequestDto } from './dto/voice-request.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('voice')
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
  ) {
    const result = await this.aiService.transcribeAndRespond(audio, {
      language: body.language ?? 'pl',
      context: body.context,
    });

    return {
      transcript: result.transcript,
      reply: result.reply,
    };
  }
}


