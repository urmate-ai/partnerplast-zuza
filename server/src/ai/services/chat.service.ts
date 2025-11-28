import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService } from './openai.service';
import type { ChatHistoryItem, ChatWithMessages } from '../types/ai.types';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
  ) {}

  async createNewChat(userId: string): Promise<string> {
    try {
      const chat = await this.prisma.chat.create({
        data: {
          userId,
          title: null,
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { currentChatId: chat.id },
      });

      this.logger.log(`New chat created for user: ${userId}, chatId: ${chat.id}`);
      return chat.id;
    } catch (error) {
      this.logger.error('Error creating new chat:', error);
      throw error;
    }
  }

  async getOrCreateCurrentChat(userId: string): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { currentChatId: true },
      });

      if (user?.currentChatId) {
        const chatExists = await this.prisma.chat.findUnique({
          where: { id: user.currentChatId },
          select: { id: true },
        });

        if (chatExists) {
          return user.currentChatId;
        }
      }

      return await this.createNewChat(userId);
    } catch (error) {
      this.logger.error('Error getting or creating current chat:', error);
      throw error;
    }
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    return this.openaiService.generateChatTitle(firstMessage);
  }

  async addMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<void> {
    try {
      await this.prisma.message.create({
        data: {
          chatId,
          role,
          content,
        },
      });

      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        select: { title: true, messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
      });

      if (!chat?.title && chat?.messages.length === 1 && role === 'user') {
        const title = await this.generateChatTitle(content);
        await this.prisma.chat.update({
          where: { id: chatId },
          data: { title },
        });
        this.logger.log(`Chat title generated: ${title} for chatId: ${chatId}`);
      }

      await this.prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      this.logger.error('Error adding message to chat:', error);
      throw error;
    }
  }

  async saveChat(userId: string, transcript: string, reply: string): Promise<void> {
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
        where: {
          id: chatId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      return {
        id: chat.id,
        title: chat.title ?? 'Bez tytułu',
        messages: chat.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          createdAt: msg.createdAt,
        })),
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error fetching chat by id:', error);
      throw error;
    }
  }

  async getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      });

      return chats.map((chat) => ({
        id: chat.id,
        title: chat.title ?? 'Bez tytułu',
        timestamp: this.formatTimestamp(chat.updatedAt),
      }));
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
                some: {
                  content: { contains: query, mode: 'insensitive' },
                },
              },
            },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
      });

      return chats.map((chat) => ({
        id: chat.id,
        title: chat.title ?? 'Bez tytułu',
        timestamp: this.formatTimestamp(chat.updatedAt),
      }));
    } catch (error) {
      this.logger.error('Error searching chats:', error);
      return [];
    }
  }

  private formatTimestamp(date: Date | string): string {
    const chatDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - chatDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Teraz';
    } else if (diffHours < 24) {
      return 'Dzisiaj';
    } else if (diffDays === 1) {
      return 'Wczoraj';
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 'Tydzień temu' : `${weeks} tygodnie temu`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? 'Miesiąc temu' : `${months} miesiące temu`;
    }
  }
}
