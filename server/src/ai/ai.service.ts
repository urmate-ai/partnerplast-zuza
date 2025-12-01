import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './services/openai.service';
import { ChatService } from './services/chat.service';
import { GmailService } from '../integrations/services/gmail.service';
import type {
  AudioFile,
  VoiceProcessOptions,
  VoiceProcessResult,
  ChatHistoryItem,
  ChatWithMessages,
} from './types/ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly chatService: ChatService,
    private readonly gmailService: GmailService,
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

    let gmailContext = '';
    let isGmailConnected = false;
    try {
      const gmailStatus = await this.gmailService.getConnectionStatus(userId);
      isGmailConnected = gmailStatus.isConnected;
      if (gmailStatus.isConnected) {
        gmailContext = await this.gmailService.getMessagesForAiContext(
          userId,
          20,
        );
        this.logger.log(`Gmail context added for user ${userId}`);
      }
    } catch (error) {
      this.logger.warn('Failed to fetch Gmail context:', error);
    }

    const enhancedOptions = {
      ...options,
      context: gmailContext
        ? `${options.context || ''}\n\n${gmailContext}\n\nUWAGA: Użytkownik ma połączone konto Gmail. Jeśli poprosi o wysłanie emaila, poinformuj go, że może to zrobić.`
        : options.context,
    };

    const result = await this.openaiService.transcribeAndRespondWithHistory(
      file,
      messages,
      enhancedOptions,
    );

    if (isGmailConnected) {
      try {
        const emailIntent = await this.openaiService.detectEmailIntent(
          result.transcript,
        );
        if (emailIntent.shouldSendEmail) {
          this.logger.log(`Email intent detected for user ${userId}`);
          return {
            ...result,
            emailIntent,
          };
        }
      } catch (error) {
        this.logger.warn('Failed to detect email intent:', error);
      }
    }

    return result;
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
