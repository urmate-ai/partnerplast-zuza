import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { OpenAIChatTitleService } from '../openai/openai-chat-title.service';
import type { Chat, Message, User } from '@prisma/client';
import type { PrismaUpdateResult } from '../../../common/types/test.types';

describe('ChatService', () => {
  let service: ChatService;
  let prismaService: jest.Mocked<PrismaService>;
  let chatTitleService: jest.Mocked<OpenAIChatTitleService>;

  const mockUserId = 'user-123';
  const mockChatId = 'chat-123';

  beforeEach(async () => {
    const mockPrismaService = {
      chat: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      message: {
        create: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockChatTitleService = {
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OpenAIChatTitleService,
          useValue: mockChatTitleService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prismaService = module.get(PrismaService);
    chatTitleService = module.get(OpenAIChatTitleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewChat', () => {
    it('powinien utworzyć nowy chat i zaktualizować currentChatId użytkownika', async () => {
      const mockChat: Chat = {
        id: mockChatId,
        userId: mockUserId,
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Chat;

      (prismaService.chat.create as jest.Mock).mockResolvedValue(mockChat);

      const mockUpdateResult: PrismaUpdateResult = { id: mockUserId };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        mockUpdateResult as User,
      );

      const result = await service.createNewChat(mockUserId);

      expect(prismaService.chat.create as jest.Mock).toHaveBeenCalledWith({
        data: { userId: mockUserId },
      });
      expect(prismaService.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { currentChatId: mockChatId },
      });
      expect(result).toBe(mockChatId);
    });

    it('powinien rzucić błąd gdy tworzenie chatu się nie powiedzie', async () => {
      (prismaService.chat.create as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.createNewChat(mockUserId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getOrCreateCurrentChat', () => {
    it('powinien zwrócić istniejący chat gdy currentChatId jest ustawiony', async () => {
      const mockUser: Partial<User> = {
        currentChatId: mockChatId,
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as User | null,
      );

      const mockChatPartial: Partial<Chat> = {
        id: mockChatId,
      };
      (prismaService.chat.findUnique as jest.Mock).mockResolvedValue(
        mockChatPartial as Chat | null,
      );

      const result = await service.getOrCreateCurrentChat(mockUserId);

      expect(result).toBe(mockChatId);
      expect(prismaService.chat.create as jest.Mock).not.toHaveBeenCalled();
    });

    it('powinien utworzyć nowy chat gdy currentChatId nie istnieje', async () => {
      const mockUserNull: Partial<User> = {
        currentChatId: null,
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUserNull as User | null,
      );

      const mockNewChat: Chat = {
        id: mockChatId,
        userId: mockUserId,
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Chat;
      (prismaService.chat.create as jest.Mock).mockResolvedValue(mockNewChat);

      const mockUpdateResult: PrismaUpdateResult = { id: mockUserId };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        mockUpdateResult as User,
      );

      const result = await service.getOrCreateCurrentChat(mockUserId);

      expect(prismaService.chat.create as jest.Mock).toHaveBeenCalled();
      expect(result).toBe(mockChatId);
    });
  });

  describe('addMessage', () => {
    it('powinien dodać wiadomość do chatu', async () => {
      const mockMessage: Partial<Message> = {
        id: 'msg-1',
        chatId: mockChatId,
        role: 'user',
        content: 'Test message',
        createdAt: new Date(),
      };
      (prismaService.message.create as jest.Mock).mockResolvedValue(
        mockMessage as Message,
      );

      const mockChatWithTitle: Partial<Chat> = {
        title: 'Test Chat',
      };
      (prismaService.chat.findUnique as jest.Mock).mockResolvedValue(
        mockChatWithTitle as Chat | null,
      );
      (prismaService.message.count as jest.Mock).mockResolvedValue(2);
      const mockChatUpdate: PrismaUpdateResult = { id: mockChatId };
      (prismaService.chat.update as jest.Mock).mockResolvedValue(
        mockChatUpdate as Chat,
      );

      await service.addMessage(mockChatId, 'user', 'Test message');

      expect(prismaService.message.create as jest.Mock).toHaveBeenCalledWith({
        data: {
          chatId: mockChatId,
          role: 'user',
          content: 'Test message',
        },
      });
    });

    it('powinien wygenerować tytuł dla pierwszej wiadomości użytkownika', async () => {
      const mockMessage2: Partial<Message> = {
        id: 'msg-2',
        chatId: mockChatId,
        role: 'user',
        content: 'Pierwsza wiadomość',
        createdAt: new Date(),
      };
      (prismaService.message.create as jest.Mock).mockResolvedValue(
        mockMessage2 as Message,
      );

      const mockChatNullTitle: Partial<Chat> = {
        title: null,
      };
      (prismaService.chat.findUnique as jest.Mock).mockResolvedValue(
        mockChatNullTitle as Chat | null,
      );
      (prismaService.message.count as jest.Mock).mockResolvedValue(1);
      chatTitleService.generate.mockResolvedValue('Nowy tytuł');
      const mockChatUpdate2: PrismaUpdateResult = {
        id: mockChatId,
        title: 'Nowy tytuł',
      };
      (prismaService.chat.update as jest.Mock).mockResolvedValue(
        mockChatUpdate2 as Chat,
      );

      await service.addMessage(mockChatId, 'user', 'Pierwsza wiadomość');

      expect(chatTitleService.generate as jest.Mock).toHaveBeenCalledWith(
        'Pierwsza wiadomość',
      );
      expect(prismaService.chat.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: mockChatId },
        data: { title: 'Nowy tytuł' },
      });
    });
  });

  describe('getChatById', () => {
    it('powinien zwrócić chat z wiadomościami', async () => {
      const mockChat = {
        id: mockChatId,
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            createdAt: new Date(),
          },
        ],
      };

      (prismaService.chat.findFirst as jest.Mock).mockResolvedValue(
        mockChat as
          | (Chat & {
              messages: Array<
                Partial<Message> & {
                  id: string;
                  role: string;
                  content: string;
                  createdAt: Date;
                }
              >;
            })
          | null,
      );

      const result = await service.getChatById(mockChatId, mockUserId);

      expect(prismaService.chat.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: { id: mockChatId, userId: mockUserId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      expect(result.id).toBe(mockChatId);
      expect(result.messages).toHaveLength(1);
    });

    it('powinien rzucić NotFoundException gdy chat nie istnieje', async () => {
      (prismaService.chat.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getChatById(mockChatId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getChatHistory', () => {
    it('powinien zwrócić historię czatów użytkownika', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          title: 'Chat 1',
          updatedAt: new Date('2024-01-15'),
        },
        {
          id: 'chat-2',
          title: 'Chat 2',
          updatedAt: new Date('2024-01-14'),
        },
      ];

      (prismaService.chat.findMany as jest.Mock).mockResolvedValue(
        mockChats as Array<Pick<Chat, 'id' | 'title' | 'updatedAt'>>,
      );

      const result = await service.getChatHistory(mockUserId);

      expect(prismaService.chat.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: { id: true, title: true, updatedAt: true },
      });
      expect(result).toHaveLength(2);
    });

    it('powinien zwrócić pustą tablicę w przypadku błędu', async () => {
      (prismaService.chat.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getChatHistory(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('searchChats', () => {
    it('powinien wyszukać czaty po zapytaniu', async () => {
      const mockChats = [
        {
          id: 'chat-1',
          title: 'Test Chat',
          updatedAt: new Date(),
        },
      ];

      (prismaService.chat.findMany as jest.Mock).mockResolvedValue(
        mockChats as Array<Pick<Chat, 'id' | 'title' | 'updatedAt'>>,
      );

      const result = await service.searchChats(mockUserId, 'test');

      expect(prismaService.chat.findMany as jest.Mock).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            {
              messages: {
                some: { content: { contains: 'test', mode: 'insensitive' } },
              },
            },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: { id: true, title: true, updatedAt: true },
      });
      expect(result).toHaveLength(1);
    });
  });
});
