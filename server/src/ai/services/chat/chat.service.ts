import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OpenAIChatTitleService } from '../openai/openai-chat-title.service';
import { ChatMapper } from '../../utils/chat.mapper';
import type { ChatHistoryItem, ChatWithMessages } from '../../types/ai.types';
import type { ChatRole } from '../../types/chat.types';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatTitleService: OpenAIChatTitleService,
  ) {}

  async createNewChat(userId: string): Promise<string> {
    try {
      const chat = await this.prisma.chat.create({
        data: { userId },
      });

      await this.updateUserCurrentChat(userId, chat.id);
      this.logger.log(
        `New chat created for user: ${userId}, chatId: ${chat.id}`,
      );
      return chat.id;
    } catch (error) {
      this.logger.error('Error creating new chat:', error);
      throw error;
    }
  }

  async getOrCreateCurrentChat(userId: string): Promise<string> {
    try {
      const currentChatId = await this.getUserCurrentChatId(userId);
      if (currentChatId && (await this.chatExists(currentChatId))) {
        return currentChatId;
      }
      return await this.createNewChat(userId);
    } catch (error) {
      this.logger.error('Error getting or creating current chat:', error);
      throw error;
    }
  }

  async addMessage(
    chatId: string,
    role: ChatRole,
    content: string,
  ): Promise<void> {
    try {
      await this.prisma.message.create({
        data: { chatId, role, content },
      });

      if (role === 'user') {
        await this.handleFirstUserMessage(chatId, content);
      }

      await this.updateChatTimestamp(chatId);
    } catch (error) {
      this.logger.error('Error adding message to chat:', error);
      throw error;
    }
  }

  async saveChat(
    userId: string,
    transcript: string,
    reply: string,
  ): Promise<void> {
    try {
      const chatId = await this.getOrCreateCurrentChat(userId);
      await this.addMessage(chatId, 'user', transcript);
      await this.addMessage(chatId, 'assistant', reply);
      this.logger.log(`Chat saved for user: ${userId}, chatId: ${chatId}`);
    } catch (error) {
      this.logger.error('Error saving chat to database:', error);
      throw error;
    }
  }

  async getChatById(chatId: string, userId: string): Promise<ChatWithMessages> {
    try {
      const chat = await this.prisma.chat.findFirst({
        where: { id: chatId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      return ChatMapper.toDto(chat);
    } catch (error) {
      this.logger.error('Error fetching chat by id:', error);
      throw error;
    }
  }

  /**
   * Pobiera ostatnie N wiadomości z czatu (dla kontekstu AI)
   * @param chatId ID czatu
   * @param userId ID użytkownika
   * @param limit Liczba ostatnich wiadomości (domyślnie 20)
   */
  async getRecentMessages(
    chatId: string,
    userId: string,
    limit: number = 20,
  ): Promise<ChatWithMessages> {
    try {
      const chat = await this.prisma.chat.findFirst({
        where: { id: chatId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: limit,
          },
        },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      // Odwróć kolejność wiadomości, aby były chronologicznie
      const chatWithOrderedMessages = {
        ...chat,
        messages: chat.messages.reverse(),
      };

      return ChatMapper.toDto(chatWithOrderedMessages);
    } catch (error) {
      this.logger.error('Error fetching recent messages:', error);
      throw error;
    }
  }

  async getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: { id: true, title: true, updatedAt: true },
      });

      return chats.map((chat) => ChatMapper.toHistoryItem(chat));
    } catch (error) {
      this.logger.error('Error fetching chat history:', error);
      return [];
    }
  }

  async searchChats(userId: string, query: string): Promise<ChatHistoryItem[]> {
    try {
      const chats = await this.prisma.chat.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            {
              messages: {
                some: { content: { contains: query, mode: 'insensitive' } },
              },
            },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: { id: true, title: true, updatedAt: true },
      });

      return chats.map((chat) => ChatMapper.toHistoryItem(chat));
    } catch (error) {
      this.logger.error('Error searching chats:', error);
      return [];
    }
  }

  private async getUserCurrentChatId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentChatId: true },
    });
    return user?.currentChatId ?? null;
  }

  private async chatExists(chatId: string): Promise<boolean> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true },
    });
    return !!chat;
  }

  private async updateUserCurrentChat(
    userId: string,
    chatId: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentChatId: chatId },
    });
  }

  private async handleFirstUserMessage(
    chatId: string,
    content: string,
  ): Promise<void> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { title: true },
    });

    if (!chat?.title) {
      const messageCount = await this.prisma.message.count({
        where: { chatId },
      });
      if (messageCount === 1) {
        const title = await this.chatTitleService.generate(content);
        await this.prisma.chat.update({
          where: { id: chatId },
          data: { title },
        });
        this.logger.log(`Chat title generated: ${title} for chatId: ${chatId}`);
      }
    }
  }

  private async updateChatTimestamp(chatId: string): Promise<void> {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });
  }
}
