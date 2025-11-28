import { Injectable } from '@nestjs/common';
import { OpenAIService } from './services/openai.service';
import { ChatService } from './services/chat.service';
import type {
  AudioFile,
  VoiceProcessOptions,
  VoiceProcessResult,
  ChatHistoryItem,
  ChatWithMessages,
} from './types/ai.types';

@Injectable()
export class AiService {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly chatService: ChatService,
  ) {}

  async transcribeAndRespond(
    file: AudioFile,
    userId: string,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    const chatId = await this.chatService.getOrCreateCurrentChat(userId);

    const chat = await this.chatService.getChatById(chatId, userId);

    const messages = chat.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return this.openaiService.transcribeAndRespondWithHistory(
      file,
      messages,
      options,
    );
  }

  async saveChat(
    userId: string,
    transcript: string,
    reply: string,
  ): Promise<void> {
    return this.chatService.saveChat(userId, transcript, reply);
  }

  async getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
    return this.chatService.getChatHistory(userId);
  }

  async searchChats(userId: string, query: string): Promise<ChatHistoryItem[]> {
    return this.chatService.searchChats(userId, query);
  }

  async getChatById(chatId: string, userId: string): Promise<ChatWithMessages> {
    return this.chatService.getChatById(chatId, userId);
  }

  async createNewChat(userId: string): Promise<{ chatId: string }> {
    const chatId = await this.chatService.createNewChat(userId);
    return { chatId };
  }
}
