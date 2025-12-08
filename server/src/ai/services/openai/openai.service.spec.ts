import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { OpenAITranscriptionService } from './openai-transcription.service';
import { OpenAIResponseService } from './openai-response.service';
import { OpenAIIntentDetectionService } from './openai-intent-detection.service';
import { OpenAIChatTitleService } from './openai-chat-title.service';
import type { AudioFile } from '../../types/ai.types';

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockTranscriptionService: jest.Mocked<OpenAITranscriptionService>;
  let mockResponseService: jest.Mocked<OpenAIResponseService>;
  let mockIntentDetectionService: jest.Mocked<OpenAIIntentDetectionService>;
  let mockChatTitleService: jest.Mocked<OpenAIChatTitleService>;

  const mockAudioFile: Partial<AudioFile> = {
    path: '/tmp/test-audio.m4a',
    originalname: 'test.m4a',
    mimetype: 'audio/m4a',
  } as AudioFile;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-api-key';
        return undefined;
      }),
    };

    mockTranscriptionService = {
      transcribe: jest.fn(),
    } as unknown as jest.Mocked<OpenAITranscriptionService>;

    mockResponseService = {
      generate: jest.fn(),
    } as unknown as jest.Mocked<OpenAIResponseService>;

    mockIntentDetectionService = {
      detectEmailIntent: jest.fn(),
      detectCalendarIntent: jest.fn(),
    } as unknown as jest.Mocked<OpenAIIntentDetectionService>;

    mockChatTitleService = {
      generate: jest.fn(),
    } as unknown as jest.Mocked<OpenAIChatTitleService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OpenAITranscriptionService,
          useValue: mockTranscriptionService,
        },
        {
          provide: OpenAIResponseService,
          useValue: mockResponseService,
        },
        {
          provide: OpenAIIntentDetectionService,
          useValue: mockIntentDetectionService,
        },
        {
          provide: OpenAIChatTitleService,
          useValue: mockChatTitleService,
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('powinien przetranskrybować audio i zwrócić tekst', async () => {
      const transcript = 'Przetranskrybowany tekst';
      mockTranscriptionService.transcribe.mockResolvedValue(transcript);

      const result = await service.transcribeAudio(mockAudioFile, 'pl');

      expect(mockTranscriptionService.transcribe).toHaveBeenCalledWith(
        mockAudioFile,
        'pl',
      );
      expect(result).toBe(transcript);
    });

    it('powinien rzucić błąd gdy brak ścieżki do pliku', async () => {
      const fileWithoutPath: Partial<AudioFile> = {
        ...mockAudioFile,
        path: undefined,
      };

      mockTranscriptionService.transcribe.mockRejectedValue(
        new InternalServerErrorException('Audio file path is missing'),
      );

      await expect(
        service.transcribeAudio(fileWithoutPath, 'pl'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('powinien rzucić błąd gdy transkrypcja jest pusta', async () => {
      mockTranscriptionService.transcribe.mockRejectedValue(
        new InternalServerErrorException('Empty transcription result'),
      );

      await expect(
        service.transcribeAudio(mockAudioFile, 'pl'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('generateResponse', () => {
    it('powinien wygenerować odpowiedź AI', async () => {
      const transcript = 'Witaj';
      const reply = 'Cześć! Jak mogę pomóc?';

      mockResponseService.generate.mockResolvedValue(reply);

      const result = await service.generateResponse(transcript);

      expect(mockResponseService.generate).toHaveBeenCalledWith(
        transcript,
        [],
        undefined,
        undefined,
        false,
        undefined,
      );
      expect(result).toBe(reply);
    });

    it('powinien zwrócić komunikat błędu gdy odpowiedź jest pusta', async () => {
      mockResponseService.generate.mockResolvedValue(
        'Przepraszam, nie udało mi się wygenerować odpowiedzi na to pytanie.',
      );

      const result = await service.generateResponse('test');

      expect(result).toBe(
        'Przepraszam, nie udało mi się wygenerować odpowiedzi na to pytanie.',
      );
    });
  });

  describe('transcribeAndRespond', () => {
    it('powinien przetranskrybować i wygenerować odpowiedź', async () => {
      const transcript = 'Witaj';
      const reply = 'Cześć!';

      mockTranscriptionService.transcribe.mockResolvedValue(transcript);
      mockResponseService.generate.mockResolvedValue(reply);

      const result = await service.transcribeAndRespond(mockAudioFile, {
        language: 'pl',
      });

      expect(result.transcript).toBe(transcript);
      expect(result.reply).toBe(reply);
    });
  });

  describe('generateChatTitle', () => {
    it('powinien wygenerować tytuł chatu', async () => {
      const firstMessage = 'Jakie jest najlepsze miejsce na wakacje?';
      const title = 'Najlepsze miejsca na wakacje';

      mockChatTitleService.generate.mockResolvedValue(title);

      const result = await service.generateChatTitle(firstMessage);

      expect(mockChatTitleService.generate).toHaveBeenCalledWith(firstMessage);
      expect(result).toBe(title);
    });

    it('powinien skrócić tytuł jeśli jest za długi', async () => {
      const longTitle = 'A'.repeat(100);
      const truncatedTitle = longTitle.substring(0, 60);

      mockChatTitleService.generate.mockResolvedValue(truncatedTitle);

      const result = await service.generateChatTitle('test');

      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('powinien zwrócić domyślny tytuł w przypadku błędu', async () => {
      mockChatTitleService.generate.mockResolvedValue('Nowa rozmowa');

      const result = await service.generateChatTitle('test');

      expect(result).toBe('Nowa rozmowa');
    });
  });
});
