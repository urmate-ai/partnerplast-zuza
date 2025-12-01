import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import * as fs from 'node:fs';
import * as OpenAI from 'openai';
import type { AudioFile } from '../types/ai.types';

type MockChatCompletion = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

jest.mock('node:fs');
jest.mock('openai');

describe('OpenAIService', () => {
  let service: OpenAIService;
  let mockOpenAI: jest.Mocked<OpenAI.OpenAI>;

  const mockAudioFile: Partial<AudioFile> = {
    path: '/tmp/test-audio.m4a',
    originalname: 'test.m4a',
    mimetype: 'audio/m4a',
  } as AudioFile;

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
      responses: {
        create: jest.fn(),
      },
    } as unknown as jest.Mocked<OpenAI.OpenAI>;

    (OpenAI.OpenAI as unknown as jest.Mock).mockImplementation(
      () => mockOpenAIClient,
    );
    mockOpenAI = mockOpenAIClient;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transcribeAudio', () => {
    it('powinien przetranskrybować audio i zwrócić tekst', async () => {
      const transcript = 'Przetranskrybowany tekst';
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        transcript as string,
      );

      const result = await service.transcribeAudio(mockAudioFile, 'pl');

      expect(fs.readFileSync).toHaveBeenCalledWith(mockAudioFile.path);
      expect(
        mockOpenAI.audio.transcriptions.create as jest.Mock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'whisper-1',
          language: 'pl',
          response_format: 'text',
        }),
      );
      expect(result).toBe(transcript);
      expect(fs.unlink).toHaveBeenCalledWith(
        mockAudioFile.path,
        expect.any(Function),
      );
    });

    it('powinien rzucić błąd gdy brak ścieżki do pliku', async () => {
      const fileWithoutPath: Partial<AudioFile> = {
        ...mockAudioFile,
        path: undefined,
      };

      await expect(
        service.transcribeAudio(fileWithoutPath, 'pl'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('powinien rzucić błąd gdy transkrypcja jest pusta', async () => {
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        '' as string,
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

      (
        mockOpenAI as unknown as { responses: { create: jest.Mock } }
      ).responses.create.mockResolvedValue({
        output_text: reply,
      });

      const result = await service.generateResponse(transcript);

      expect(
        (mockOpenAI as unknown as { responses: { create: jest.Mock } })
          .responses.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-5',
          input: expect.stringContaining(transcript),
          reasoning: { effort: 'low' },
          tools: [
            expect.objectContaining({
              type: 'web_search',
            }),
          ],
        }),
      );
      expect(result).toBe('Cześć!');
    });

    it('powinien zwrócić komunikat błędu gdy odpowiedź jest pusta', async () => {
      (
        mockOpenAI as unknown as { responses: { create: jest.Mock } }
      ).responses.create.mockResolvedValue({
        output_text: '',
      });

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

      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        transcript as string,
      );
      (
        mockOpenAI as unknown as { responses: { create: jest.Mock } }
      ).responses.create.mockResolvedValue({
        output_text: reply,
      });

      const result = await service.transcribeAndRespond(mockAudioFile, {
        language: 'pl',
      });

      expect(result).toEqual({ transcript, reply });
    });
  });

  describe('generateChatTitle', () => {
    it('powinien wygenerować tytuł chatu', async () => {
      const firstMessage = 'Jakie jest najlepsze miejsce na wakacje?';
      const title = 'Najlepsze miejsca na wakacje';

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: title } }],
      } as MockChatCompletion);

      const result = await service.generateChatTitle(firstMessage);

      expect(result).toBe(title);
      expect(
        mockOpenAI.chat.completions.create as jest.Mock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          max_tokens: 30,
        }),
      );
    });

    it('powinien skrócić tytuł jeśli jest za długi', async () => {
      const longTitle = 'A'.repeat(100);

      (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue({
        choices: [{ message: { content: longTitle } }],
      } as MockChatCompletion);

      const result = await service.generateChatTitle('test');

      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('powinien zwrócić domyślny tytuł w przypadku błędu', async () => {
      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      const result = await service.generateChatTitle('test');

      expect(result).toBe('Nowa rozmowa');
    });
  });
});
