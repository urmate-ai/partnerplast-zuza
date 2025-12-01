import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIChatTitleService } from './openai-chat-title.service';
import OpenAI from 'openai';
import { PromptUtils } from '../utils/prompt.utils';

jest.mock('openai');

describe('OpenAIChatTitleService', () => {
  let service: OpenAIChatTitleService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockApiKey = 'test-api-key';
  const mockFirstMessage = 'What is the weather today?';

  beforeEach(async () => {
    const mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<OpenAI>;

    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIClient);
    mockOpenAI = mockOpenAIClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: OpenAIChatTitleService,
          useFactory: () => new OpenAIChatTitleService(mockApiKey),
        },
      ],
    }).compile();

    service = module.get<OpenAIChatTitleService>(OpenAIChatTitleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with API key', () => {
      expect(service).toBeDefined();
    });

    it('should create service without API key and log warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const serviceWithoutKey = new OpenAIChatTitleService(undefined);
      expect(serviceWithoutKey).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('generate', () => {
    it('should generate chat title successfully', async () => {
      const mockTitle = 'Weather Inquiry';
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: mockTitle,
            },
          },
        ],
      } as never);

      const result = await service.generate(mockFirstMessage);

      expect(result).toBe(mockTitle);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: PromptUtils.TITLE_GENERATION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: PromptUtils.generateTitlePrompt(mockFirstMessage),
          },
        ],
        max_tokens: 30,
        temperature: 0.7,
      });
    });

    it('should return default title when response is empty', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      } as never);

      const result = await service.generate(mockFirstMessage);

      expect(result).toBe('Nowa rozmowa');
    });

    it('should return default title when choices array is empty', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [],
      } as never);

      const result = await service.generate(mockFirstMessage);

      expect(result).toBe('Nowa rozmowa');
    });

    it('should truncate title longer than 60 characters', async () => {
      const longTitle = 'A'.repeat(100);
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: longTitle,
            },
          },
        ],
      } as never);

      const result = await service.generate(mockFirstMessage);

      expect(result).toHaveLength(60);
      expect(result).toBe(longTitle.substring(0, 60));
    });

    it('should trim whitespace from title', async () => {
      const titleWithWhitespace = '  Weather Inquiry  ';
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: titleWithWhitespace,
            },
          },
        ],
      } as never);

      const result = await service.generate(mockFirstMessage);

      expect(result).toBe('Weather Inquiry');
    });

    it('should return default title on error', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      const result = await service.generate(mockFirstMessage);

      expect(result).toBe('Nowa rozmowa');
    });

    it('should handle title exactly 60 characters', async () => {
      const exactTitle = 'A'.repeat(60);
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: exactTitle,
            },
          },
        ],
      } as never);

      const result = await service.generate(mockFirstMessage);

      expect(result).toBe(exactTitle);
      expect(result).toHaveLength(60);
    });
  });
});
