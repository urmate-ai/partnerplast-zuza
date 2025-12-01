import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { OpenAITranscriptionService } from './openai-transcription.service';
import OpenAI, { toFile } from 'openai';
import * as fs from 'node:fs';
import type { AudioFile } from '../../types/ai.types';

jest.mock('openai');
jest.mock('node:fs');

describe('OpenAITranscriptionService', () => {
  let service: OpenAITranscriptionService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockApiKey = 'test-api-key';
  const mockAudioFile: AudioFile = {
    path: '/tmp/test-audio.m4a',
    originalname: 'test.m4a',
    mimetype: 'audio/m4a',
    size: 1024,
    fieldname: 'audio',
    encoding: '7bit',
    destination: '/tmp',
    filename: 'test-audio.m4a',
    buffer: Buffer.from('test'),
  };

  beforeEach(async () => {
    const mockOpenAIClient = {
      audio: {
        transcriptions: {
          create: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<OpenAI>;

    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIClient);
    mockOpenAI = mockOpenAIClient;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: OpenAITranscriptionService,
          useFactory: () => new OpenAITranscriptionService(mockApiKey),
        },
      ],
    }).compile();

    service = module.get<OpenAITranscriptionService>(
      OpenAITranscriptionService,
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
      const serviceWithoutKey = new OpenAITranscriptionService(undefined);
      expect(serviceWithoutKey).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('transcribe', () => {
    it('should transcribe audio file successfully', async () => {
      const mockTranscript = 'This is a test transcription';
      const mockBuffer = Buffer.from('audio data');

      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      (toFile as jest.Mock).mockResolvedValue({
        name: 'test.m4a',
      });
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        mockTranscript as never,
      );
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => {
        if (callback) callback(null);
      });

      const result = await service.transcribe(mockAudioFile);

      expect(result).toBe(mockTranscript);
      expect(fs.readFileSync).toHaveBeenCalledWith(mockAudioFile.path);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith({
        file: { name: 'test.m4a' },
        model: 'whisper-1',
        language: undefined,
        response_format: 'text',
      });
    });

    it('should transcribe with language parameter', async () => {
      const mockTranscript = 'Test transcription';
      const mockBuffer = Buffer.from('audio data');

      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      (toFile as jest.Mock).mockResolvedValue({ name: 'test.m4a' });
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        mockTranscript as never,
      );
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => {
        if (callback) callback(null);
        callback(null);
      });

      const result = await service.transcribe(mockAudioFile, 'pl');

      expect(result).toBe(mockTranscript);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'pl',
        }),
      );
    });

    it('should throw error when file is missing', async () => {
      await expect(
        service.transcribe(undefined as unknown as AudioFile),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw error when file path is missing', async () => {
      const invalidFile = { ...mockAudioFile, path: undefined };
      await expect(
        service.transcribe(invalidFile as unknown as AudioFile),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw error when transcription is empty', async () => {
      const mockBuffer = Buffer.from('audio data');

      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      (toFile as jest.Mock).mockResolvedValue({ name: 'test.m4a' });
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        '' as never,
      );
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => {
        if (callback) callback(null);
        callback(null);
      });

      await expect(service.transcribe(mockAudioFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should cleanup file after transcription', async () => {
      const mockTranscript = 'Test transcription';
      const mockBuffer = Buffer.from('audio data');

      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      (toFile as jest.Mock).mockResolvedValue({ name: 'test.m4a' });
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        mockTranscript as never,
      );
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => {
        if (callback) callback(null);
        callback(null);
      });

      await service.transcribe(mockAudioFile);

      expect(fs.unlink).toHaveBeenCalledWith(
        mockAudioFile.path,
        expect.any(Function),
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockTranscript = 'Test transcription';
      const mockBuffer = Buffer.from('audio data');

      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      (toFile as jest.Mock).mockResolvedValue({ name: 'test.m4a' });
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        mockTranscript as never,
      );
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => {
        if (callback) callback(new Error('Cleanup failed'));
        callback(new Error('Cleanup failed'));
      });

      const result = await service.transcribe(mockAudioFile);

      expect(result).toBe(mockTranscript);
    });

    it('should use default originalname when not provided', async () => {
      const mockTranscript = 'Test transcription';
      const mockBuffer = Buffer.from('audio data');
      const fileWithoutName = { ...mockAudioFile, originalname: undefined };

      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      (toFile as jest.Mock).mockResolvedValue({ name: 'audio.m4a' });
      (mockOpenAI.audio.transcriptions.create as jest.Mock).mockResolvedValue(
        mockTranscript as never,
      );
      (fs.unlink as unknown as jest.Mock).mockImplementation((_, callback) => {
        if (callback) callback(null);
        callback(null);
      });

      await service.transcribe(fileWithoutName);

      expect(toFile).toHaveBeenCalledWith(mockBuffer, 'audio.m4a');
    });
  });
});
