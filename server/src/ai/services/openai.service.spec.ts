import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import * as fs from 'node:fs';
import * as OpenAI from 'openai';

jest.mock('node:fs');
jest.mock('openai');

describe('OpenAIService', () => {
  let service: OpenAIService;
  let configService: ConfigService;
  let mockOpenAI: jest.Mocked<OpenAI.OpenAI>;

  const mockAudioFile = {
    path: '/tmp/test-audio.m4a',
    originalname: 'test.m4a',
    mimetype: 'audio/m4a',
  } as any;

  beforeEach(async () => {
    const mockOpenAIClient = {
      audio: {
        transcriptions: {
          create: jest.fn(),
        },
      },
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (OpenAI.OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIClient);
    mockOpenAI = mockOpenAIClient as any;

    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('audio-data'));
    (fs.unlink as unknown as jest.Mock).mockImplementation((path, callback) => {
      if (callback) callback(null);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'OPENAI_API_KEY') return 'test-api-key';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('powinien przetranskrybować audio i zwrócić tekst', async () => {
      const transcript = 'Przetranskrybowany tekst';
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(transcript as any);

      const result = await service.transcribeAudio(mockAudioFile, 'pl');

      expect(fs.readFileSync).toHaveBeenCalledWith(mockAudioFile.path);
      expect(mockOpenAI.audio.transcriptions.create as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'whisper-1',
          language: 'pl',
          response_format: 'text',
        }),
      );
      expect(result).toBe(transcript);
      expect(fs.unlink).toHaveBeenCalledWith(mockAudioFile.path, expect.any(Function));
    });

    it('powinien rzucić błąd gdy brak ścieżki do pliku', async () => {
      const fileWithoutPath = { ...mockAudioFile, path: undefined };

      await expect(service.transcribeAudio(fileWithoutPath, 'pl')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('powinien rzucić błąd gdy transkrypcja jest pusta', async () => {
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue('' as any);

      await expect(service.transcribeAudio(mockAudioFile, 'pl')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('generateResponse', () => {
    it('powinien wygenerować odpowiedź AI', async () => {
      const transcript = 'Witaj';
      const reply = 'Cześć! Jak mogę pomóc?';

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [
          {
            message: {
              content: reply,
            },
          },
        ],
      } as any);

      const result = await service.generateResponse(transcript);

      expect(mockOpenAI.chat.completions.create as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.any(String),
            }),
            expect.objectContaining({
              role: 'user',
              content: transcript,
            }),
          ]),
          max_tokens: 500,
        }),
      );
      expect(result).toBe(reply);
    });

    it('powinien rzucić błąd gdy odpowiedź jest pusta', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: '' } }],
      } as any);

      await expect(service.generateResponse('test')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('transcribeAndRespond', () => {
    it('powinien przetranskrybować i wygenerować odpowiedź', async () => {
      const transcript = 'Witaj';
      const reply = 'Cześć!';

      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(transcript as any);
      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: reply } }],
      } as any);

      const result = await service.transcribeAndRespond(mockAudioFile, { language: 'pl' });

      expect(result).toEqual({ transcript, reply });
    });
  });

  describe('generateChatTitle', () => {
    it('powinien wygenerować tytuł chatu', async () => {
      const firstMessage = 'Jakie jest najlepsze miejsce na wakacje?';
      const title = 'Najlepsze miejsca na wakacje';

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: title } }],
      } as any);

      const result = await service.generateChatTitle(firstMessage);

      expect(result).toBe(title);
      expect(mockOpenAI.chat.completions.create as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          max_tokens: 30,
        }),
      );
    });

    it('powinien skrócić tytuł jeśli jest za długi', async () => {
      const longTitle = 'A'.repeat(100);
      const expectedTitle = 'A'.repeat(60);

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: longTitle } }],
      } as any);

      const result = await service.generateChatTitle('test');

      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('powinien zwrócić domyślny tytuł w przypadku błędu', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await service.generateChatTitle('test');

      expect(result).toBe('Nowa rozmowa');
    });
  });
});

