import { AiService } from './ai.service';
import { ChatService } from './services/chat/chat.service';
import { OpenAIService } from './services/openai/openai.service';
import { GmailService } from '../integrations/services/gmail/gmail.service';
import { CalendarService } from '../integrations/services/calendar/calendar.service';
import { OpenAIFastResponseService } from './services/openai/openai-fast-response.service';
import { IntentClassifierService } from './services/intent/intent-classifier.service';
import { IntegrationStatusCacheService } from './services/cache/integration-status-cache.service';
import type { ChatHistoryItem, ChatWithMessages } from './types/ai.types';
import { GeminiResponseService } from './services/gemini/gemini-response.service';

describe('AiService', () => {
  let service: AiService;
  let chatService: jest.Mocked<ChatService>;
  let openaiService: jest.Mocked<OpenAIService>;
  let gmailService: jest.Mocked<GmailService>;
  let calendarService: jest.Mocked<CalendarService>;
  let fastResponseService: jest.Mocked<OpenAIFastResponseService>;
  let intentClassifier: jest.Mocked<IntentClassifierService>;
  let integrationCache: jest.Mocked<IntegrationStatusCacheService>;

  const mockUserId = 'user-123';
  const mockChatId = 'chat-123';

  beforeEach(() => {
    chatService = {
      getOrCreateCurrentChat: jest.fn(),
      getChatById: jest.fn(),
      saveChat: jest.fn(),
      getChatHistory: jest.fn(),
      searchChats: jest.fn(),
      createNewChat: jest.fn(),
    } as unknown as jest.Mocked<ChatService>;

    openaiService = {
      transcribeAudio: jest.fn(),
      generateResponse: jest.fn(),
      detectEmailIntent: jest.fn(),
      detectCalendarIntent: jest.fn(),
      detectSmsIntent: jest.fn(),
    } as unknown as jest.Mocked<OpenAIService>;

    gmailService = {
      getConnectionStatus: jest.fn(),
      getMessagesForAiContext: jest.fn(),
    } as unknown as jest.Mocked<GmailService>;

    calendarService = {
      getConnectionStatus: jest.fn(),
      getEventsForAiContext: jest.fn(),
    } as unknown as jest.Mocked<CalendarService>;

    fastResponseService = {
      generateFast: jest.fn(),
    } as unknown as jest.Mocked<OpenAIFastResponseService>;

    intentClassifier = {
      classifyIntent: jest.fn().mockReturnValue({
        needsEmailIntent: false,
        needsCalendarIntent: false,
        needsSmsIntent: false,
        isSimpleGreeting: false,
        needsWebSearch: false,
        confidence: 'high',
      }),
    } as unknown as jest.Mocked<IntentClassifierService>;

    integrationCache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(),
      cleanup: jest.fn(),
    } as unknown as jest.Mocked<IntegrationStatusCacheService>;

    service = new AiService(
      openaiService,
      fastResponseService,
      new GeminiResponseService('test'),
      chatService,
      gmailService,
      calendarService,
      intentClassifier,
      integrationCache,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
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
