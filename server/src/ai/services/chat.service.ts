import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ChatHistoryItem } from '../types/ai.types';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveChat(userId: string, transcript: string, reply: string): Promise<void> {
    try {
      const title = transcript.length > 50 
        ? transcript.substring(0, 50) + '...' 
        : transcript;

      await this.prisma.chat.create({
        data: {
          userId,
          title,
          transcript,
          reply,
        },
      });

      this.logger.log(`Chat saved for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error saving chat to database:', error);
    }
  }

  async getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
    try {
      const chats = await this.prisma.chat.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });

      return chats.map((chat: { id: string; title: string; createdAt: Date }) => ({
        id: chat.id,
        title: chat.title,
        timestamp: this.formatTimestamp(chat.createdAt),
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
            { transcript: { contains: query, mode: 'insensitive' } },
            { reply: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      });

      return chats.map((chat: { id: string; title: string; createdAt: Date }) => ({
        id: chat.id,
        title: chat.title,
        timestamp: this.formatTimestamp(chat.createdAt),
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

