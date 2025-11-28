import { sendVoiceToAi, getChatHistory } from '../ai.service';
import { apiClient } from '../../shared/utils/api';
import { getApiErrorMessage } from '../../shared/types/api.types';

jest.mock('../../shared/utils/api');
jest.mock('../../shared/types/api.types');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockGetApiErrorMessage = getApiErrorMessage as jest.MockedFunction<
  typeof getApiErrorMessage
>;

describe('ai.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVoiceToAi', () => {
    const mockUri = 'file:///path/to/audio.m4a';
    const mockResponse = {
      transcript: 'Test transcript',
      reply: 'Test reply',
    };

    it('should send voice to AI successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as never);

      const result = await sendVoiceToAi(mockUri);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/ai/voice',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include language option in form data', async () => {
      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as never);

      await sendVoiceToAi(mockUri, { language: 'pl' });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should include context option in form data', async () => {
      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as never);

      await sendVoiceToAi(mockUri, { context: 'test context' });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should throw error if uri is empty', async () => {
      await expect(sendVoiceToAi('')).rejects.toThrow('Brak ścieżki do nagrania audio');
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('API Error');
      mockApiClient.post.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('API Error');

      await expect(sendVoiceToAi(mockUri)).rejects.toThrow('API Error');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas wysyłania głosu do AI',
      );
    });
  });

  describe('getChatHistory', () => {
    const mockChatHistory = [
      {
        id: '1',
        title: 'Test Chat',
        timestamp: '2024-01-01T12:00:00Z',
      },
    ];

    it('should fetch chat history successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: mockChatHistory,
      } as never);

      const result = await getChatHistory();

      expect(mockApiClient.get).toHaveBeenCalledWith('/ai/chat-history');
      expect(result).toEqual(mockChatHistory);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('API Error');

      await expect(getChatHistory()).rejects.toThrow('API Error');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas pobierania historii czatów',
      );
    });
  });
});

