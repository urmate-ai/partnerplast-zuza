import { Injectable } from '@nestjs/common';
import { OpenAIService } from './services/openai.service';
import { ChatService } from './services/chat.service';
import type { AudioFile, VoiceProcessOptions, VoiceProcessResult, ChatHistoryItem } from './types/ai.types';

@Injectable()
export class AiService {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly chatService: ChatService,
  ) {}

  async transcribeAndRespond(
    file: AudioFile,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    return this.openaiService.transcribeAndRespond(file, options);
  }

  async saveChat(userId: string, transcript: string, reply: string): Promise<void> {
    return this.chatService.saveChat(userId, transcript, reply);
  }

  async getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
    return this.chatService.getChatHistory(userId);
  }

  async searchChats(userId: string, query: string): Promise<ChatHistoryItem[]> {
    return this.chatService.searchChats(userId, query);
  }
}


