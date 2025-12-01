import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { OpenAIIntentDetectionService } from './openai-intent-detection.service';
import OpenAI from 'openai';
import { IntentParser } from '../../utils/intent.parser';

jest.mock('openai');
jest.mock('../utils/intent.parser');

describe('OpenAIIntentDetectionService', () => {
  let service: OpenAIIntentDetectionService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockApiKey = 'test-api-key';

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
          provide: OpenAIIntentDetectionService,
          useFactory: () => new OpenAIIntentDetectionService(mockApiKey),
        },
      ],
    }).compile();

    service = module.get<OpenAIIntentDetectionService>(
      OpenAIIntentDetectionService,
    );
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
      const serviceWithoutKey = new OpenAIIntentDetectionService(undefined);
      expect(serviceWithoutKey).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('detectEmailIntent', () => {
    it('should return shouldSendEmail: false when no email keywords found', async () => {
      const transcript = 'What is the weather today?';
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug');

      const result = await service.detectEmailIntent(transcript);

      expect(result).toEqual({ shouldSendEmail: false });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('No email keywords'),
      );
    });

    it('should detect email intent when keywords are present', async () => {
      const transcript = 'Wyślij mail do Jana';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                shouldSendEmail: true,
                to: 'Jan',
                subject: null,
                body: null,
              }),
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse as never,
      );
      jest.spyOn(IntentParser, 'parseEmailIntent').mockReturnValue({
        shouldSendEmail: true,
        to: 'Jan',
      });

      const result = await service.detectEmailIntent(transcript);

      expect(result.shouldSendEmail).toBe(true);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should return shouldSendEmail: false on error', async () => {
      const transcript = 'Wyślij mail';
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );
      jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await service.detectEmailIntent(transcript);

      expect(result).toEqual({ shouldSendEmail: false });
    });

    it('should handle empty response from OpenAI', async () => {
      const transcript = 'Wyślij mail';
      const mockResponse = {
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse as never,
      );
      jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      jest.spyOn(IntentParser, 'parseEmailIntent').mockReturnValue({
        shouldSendEmail: false,
      });

      const result = await service.detectEmailIntent(transcript);

      expect(result.shouldSendEmail).toBe(false);
    });
  });

  describe('detectCalendarIntent', () => {
    it('should return shouldCreateEvent: false when no calendar keywords found', async () => {
      const transcript = 'What is the weather today?';
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug');

      const result = await service.detectCalendarIntent(transcript);

      expect(result).toEqual({ shouldCreateEvent: false });
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('No calendar keywords'),
      );
    });

    it('should detect calendar intent when keywords are present', async () => {
      const transcript =
        'Dodaj do kalendarza jutro przypomnienie na 17:00 dentysta';
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                shouldCreateEvent: true,
                summary: 'dentysta',
                startDateTime: '2025-12-02T17:00:00',
              }),
            },
          },
        ],
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(
        mockResponse as never,
      );
      jest.spyOn(IntentParser, 'parseCalendarIntent').mockReturnValue({
        shouldCreateEvent: true,
        summary: 'dentysta',
        startDateTime: '2025-12-02T17:00:00',
      });

      const result = await service.detectCalendarIntent(transcript);

      expect(result.shouldCreateEvent).toBe(true);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should return shouldCreateEvent: false on error', async () => {
      const transcript = 'Dodaj do kalendarza';
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );
      jest.spyOn(Logger.prototype, 'error').mockImplementation();

      const result = await service.detectCalendarIntent(transcript);

      expect(result).toEqual({ shouldCreateEvent: false });
    });

    it('should detect calendar intent with date keywords', async () => {
      const transcript = 'Zapisz w kalendarzu jutro spotkanie';
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug');

      await service.detectCalendarIntent(transcript);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Calendar keywords found'),
      );
    });
  });
});
