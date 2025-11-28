import { getChats, getChatById, createNewChat } from '../chats.service';
import { apiClient } from '../../shared/utils/api';
import { getApiErrorMessage } from '../../shared/types/api.types';
import type { ChatHistoryItem, ChatWithMessages } from '../../shared/types';

jest.mock('../../shared/utils/api');
jest.mock('../../shared/types/api.types');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockGetApiErrorMessage = getApiErrorMessage as jest.MockedFunction<
  typeof getApiErrorMessage
>;

describe('chats.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChats', () => {
    const mockChats: ChatHistoryItem[] = [
      {
        id: '1',
        title: 'Test Chat 1',
        timestamp: '2024-01-01T12:00:00Z',
      },
      {
        id: '2',
        title: 'Test Chat 2',
        timestamp: '2024-01-02T12:00:00Z',
      },
    ];

    it('should fetch chats successfully without search query', async () => {
      mockApiClient.get.mockResolvedValue({
        data: mockChats,
      } as never);

      const result = await getChats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/ai/chats', { params: {} });
      expect(result).toEqual(mockChats);
    });

    it('should fetch chats with search query', async () => {
      mockApiClient.get.mockResolvedValue({
        data: mockChats,
      } as never);

      const result = await getChats('test');

      expect(mockApiClient.get).toHaveBeenCalledWith('/ai/chats', { params: { search: 'test' } });
      expect(result).toEqual(mockChats);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('API Error');

      await expect(getChats()).rejects.toThrow('API Error');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(error, 'Błąd podczas pobierania czatów');
    });
  });

  describe('getChatById', () => {
    const mockChat: ChatWithMessages = {
      id: '1',
      title: 'Test Chat',
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          createdAt: '2024-01-01T12:00:00Z',
        },
      ],
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
    };

    it('should fetch chat by id successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: mockChat,
      } as never);

      const result = await getChatById('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/ai/chats/1');
      expect(result).toEqual(mockChat);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('API Error');

      await expect(getChatById('1')).rejects.toThrow('API Error');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas pobierania czatu',
      );
    });
  });

  describe('createNewChat', () => {
    it('should create new chat successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { chatId: 'new-chat-id' },
      } as never);

      const result = await createNewChat();

      expect(mockApiClient.post).toHaveBeenCalledWith('/ai/chats/new');
      expect(result).toEqual({ chatId: 'new-chat-id' });
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('API Error');
      mockApiClient.post.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('API Error');

      await expect(createNewChat()).rejects.toThrow('API Error');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas tworzenia nowego chatu',
      );
    });
  });
});

