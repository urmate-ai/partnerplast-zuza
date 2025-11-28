import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { ChatService } from './services/chat.service';
import { OpenAIService } from './services/openai.service';
import type {
  AudioFile,
  VoiceProcessResult,
  ChatHistoryItem,
  ChatWithMessages,
} from './types/ai.types';

describe('AiService', () => {
  let service: AiService;
  let chatService: jest.Mocked<ChatService>;
  let openaiService: jest.Mocked<OpenAIService>;

  const mockUserId = 'user-123';
  const mockChatId = 'chat-123';
  const mockAudioFile = {
    path: '/tmp/test.m4a',
    originalname: 'test.m4a',
  } as AudioFile;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ChatService,
          useValue: {
            getOrCreateCurrentChat: jest.fn(),
            getChatById: jest.fn(),
            saveChat: jest.fn(),
            getChatHistory: jest.fn(),
            searchChats: jest.fn(),
            createNewChat: jest.fn(),
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            transcribeAndRespondWithHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    chatService = module.get(ChatService);
    openaiService = module.get(OpenAIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAndRespond', () => {
    it('powinien przetranskrybować i odpowiedzieć z historią chatu', async () => {
      const mockChat: ChatWithMessages = {
        id: mockChatId,
        title: 'Test Chat',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            createdAt: new Date(),
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi!',
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResult: VoiceProcessResult = {
        transcript: 'Test transcript',
        reply: 'Test reply',
      };

      chatService.getOrCreateCurrentChat.mockResolvedValue(mockChatId);
      chatService.getChatById.mockResolvedValue(mockChat);
      openaiService.transcribeAndRespondWithHistory.mockResolvedValue(
        mockResult,
      );

      const result = await service.transcribeAndRespond(
        mockAudioFile,
        mockUserId,
        {
          language: 'pl',
        },
      );

      expect(chatService.getOrCreateCurrentChat).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(chatService.getChatById).toHaveBeenCalledWith(
        mockChatId,
        mockUserId,
      );
      expect(
        openaiService.transcribeAndRespondWithHistory,
      ).toHaveBeenCalledWith(
        mockAudioFile,
        [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ],
        { language: 'pl' },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('saveChat', () => {
    it('powinien zapisać chat', async () => {
      await service.saveChat(mockUserId, 'transcript', 'reply');

      expect(chatService.saveChat).toHaveBeenCalledWith(
        mockUserId,
        'transcript',
        'reply',
      );
    });
  });

  describe('getChatHistory', () => {
    it('powinien zwrócić historię czatów', async () => {
      const mockHistory: ChatHistoryItem[] = [
        { id: 'chat-1', title: 'Chat 1', timestamp: 'Dzisiaj' },
      ];

      chatService.getChatHistory.mockResolvedValue(mockHistory);

      const result = await service.getChatHistory(mockUserId);

      expect(chatService.getChatHistory).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('searchChats', () => {
    it('powinien wyszukać czaty', async () => {
      const mockResults: ChatHistoryItem[] = [
        { id: 'chat-1', title: 'Test Chat', timestamp: 'Dzisiaj' },
      ];

      chatService.searchChats.mockResolvedValue(mockResults);

      const result = await service.searchChats(mockUserId, 'test');

      expect(chatService.searchChats).toHaveBeenCalledWith(mockUserId, 'test');
      expect(result).toEqual(mockResults);
    });
  });

  describe('getChatById', () => {
    it('powinien zwrócić chat po ID', async () => {
      const mockChat: ChatWithMessages = {
        id: mockChatId,
        title: 'Test Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      chatService.getChatById.mockResolvedValue(mockChat);

      const result = await service.getChatById(mockChatId, mockUserId);

      expect(chatService.getChatById).toHaveBeenCalledWith(
        mockChatId,
        mockUserId,
      );
      expect(result).toEqual(mockChat);
    });
  });

  describe('createNewChat', () => {
    it('powinien utworzyć nowy chat', async () => {
      chatService.createNewChat.mockResolvedValue(mockChatId);

      const result = await service.createNewChat(mockUserId);

      expect(chatService.createNewChat).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({ chatId: mockChatId });
    });
  });
});
