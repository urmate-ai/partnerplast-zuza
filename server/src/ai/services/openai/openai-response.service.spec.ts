import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIResponseService } from './openai-response.service';
import { ResponseCacheService } from '../cache/response-cache.service';
import type {
  OpenAIConfig,
  OpenAIResponsePayload,
  OpenAIResponsesClient,
} from '../../types/ai.types';
import type { MessageRole } from '../../types/chat.types';
import OpenAI from 'openai';

jest.mock('../../utils/prompt.utils', () => ({
  PromptUtils: {
    DEFAULT_SYSTEM_PROMPT: 'Test system prompt',
    buildMessages: jest.fn(
      (
        systemPrompt: string,
        chatHistory: Array<{ role: string; content: string }>,
        userMessage: string,
      ): Array<{ role: string; content: string }> => [
        { role: 'system', content: systemPrompt },
        ...chatHistory.filter((msg: { role: string }) => msg.role !== 'system'),
        { role: 'user', content: userMessage },
      ],
    ),
  },
}));
jest.mock('../../utils/openai.utils', () => ({
  extractReplyFromResponse: jest.fn(
    (response: { output_text?: string }): string => {
      if (typeof response.output_text === 'string') {
        return response.output_text;
      }
      return 'Test reply';
    },
  ),
  postprocessReply: jest.fn((reply: string): string => reply.trim()),
}));

describe('OpenAIResponseService', () => {
  let service: OpenAIResponseService;
  let mockResponsesClient: jest.Mocked<OpenAIResponsesClient>;
  let cacheService: ResponseCacheService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockConfig: OpenAIConfig = {
    model: 'gpt-5',
    maxTokens: 1000,
    temperature: 0.7,
  };

  beforeEach(async () => {
    mockResponsesClient = {
      create: jest.fn(),
    } as unknown as jest.Mocked<OpenAIResponsesClient>;

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<OpenAI>;

    cacheService = new ResponseCacheService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: OpenAIResponseService,
          useFactory: () =>
            new OpenAIResponseService(
              mockResponsesClient,
              mockConfig,
              cacheService,
              mockOpenAI,
            ),
        },
      ],
    }).compile();

    service = module.get<OpenAIResponseService>(OpenAIResponseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });

  describe('generate', () => {
    const mockTranscript = 'What is the weather?';
    const mockChatHistory: Array<{ role: MessageRole; content: string }> = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    it('should generate response successfully', async () => {
      const mockResponse: OpenAIResponsePayload = {
        output_text: 'The weather is sunny today.',
      };

      mockResponsesClient.create.mockResolvedValue(mockResponse as never);

      const result = await service.generate(mockTranscript, mockChatHistory);

      expect(result).toBe('The weather is sunny today.');
      expect(mockResponsesClient.create).toHaveBeenCalled();
    });

    it('should use cached response when available', async () => {
      const mockResponse: OpenAIResponsePayload = {
        output_text: 'Cached response',
      };

      mockResponsesClient.create.mockResolvedValueOnce(mockResponse as never);
      await service.generate(mockTranscript, mockChatHistory);

      const result = await service.generate(mockTranscript, mockChatHistory);

      expect(result).toBe('Cached response');
      expect(mockResponsesClient.create).toHaveBeenCalledTimes(1);
    });

    it('should include context in system prompt', async () => {
      const context = 'User has Gmail connected';
      const mockResponse: OpenAIResponsePayload = {
        output_text: 'Response with context',
      };

      mockResponsesClient.create.mockResolvedValue(mockResponse as never);

      await service.generate(mockTranscript, mockChatHistory, context);

      expect(mockResponsesClient.create).toHaveBeenCalled();
      const callArgs = mockResponsesClient.create.mock.calls[0][0];
      expect(callArgs.input).toContain(context);
    });

    it('should include location in system prompt', async () => {
      const location = 'Warsaw, Poland';
      const mockResponse: OpenAIResponsePayload = {
        output_text: 'Response with location',
      };

      mockResponsesClient.create.mockResolvedValue(mockResponse as never);

      await service.generate(
        mockTranscript,
        mockChatHistory,
        undefined,
        location,
      );

      expect(mockResponsesClient.create).toHaveBeenCalled();
      const callArgs = mockResponsesClient.create.mock.calls[0][0];
      expect(callArgs.input).toContain(location);
    });

    it('should handle empty response gracefully', async () => {
      const mockResponse: OpenAIResponsePayload = {
        output_text: '',
      };

      mockResponsesClient.create.mockResolvedValue(mockResponse as never);

      const result = await service.generate(mockTranscript, mockChatHistory);

      expect(result).toContain('Przepraszam');
    });

    it('should build correct request body without web search', async () => {
      const mockResponse: OpenAIResponsePayload = {
        output_text: 'Test response',
      };

      mockResponsesClient.create.mockResolvedValue(mockResponse as never);

      await service.generate(
        mockTranscript,
        mockChatHistory,
        undefined,
        undefined,
        false,
      );

      expect(mockResponsesClient.create).toHaveBeenCalledWith({
        model: mockConfig.model,
        input: expect.any(String),
        reasoning: { effort: 'low' },
        max_output_tokens: mockConfig.maxTokens,
      });
      const callArgs = mockResponsesClient.create.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('tools');
    });

    it('should build correct request body with web search', async () => {
      const mockResponse: OpenAIResponsePayload = {
        output_text: 'Test response',
      };

      mockResponsesClient.create.mockResolvedValue(mockResponse as never);

      await service.generate(
        mockTranscript,
        mockChatHistory,
        undefined,
        undefined,
        true,
      );

      expect(mockResponsesClient.create).toHaveBeenCalledWith({
        model: 'gpt-5',
        input: expect.any(String),
        reasoning: { effort: 'low' },
        tools: [{ type: 'web_search' }],
        max_output_tokens: mockConfig.maxTokens,
      });
    });

    it('should handle different cache keys for different inputs', async () => {
      const mockResponse1: OpenAIResponsePayload = {
        output_text: 'Response 1',
      };
      const mockResponse2: OpenAIResponsePayload = {
        output_text: 'Response 2',
      };

      mockResponsesClient.create
        .mockResolvedValueOnce(mockResponse1 as never)
        .mockResolvedValueOnce(mockResponse2 as never);

      const result1 = await service.generate('Question 1', mockChatHistory);
      const result2 = await service.generate('Question 2', mockChatHistory);

      expect(result1).toBe('Response 1');
      expect(result2).toBe('Response 2');
      expect(mockResponsesClient.create).toHaveBeenCalledTimes(2);
    });
  });
});
