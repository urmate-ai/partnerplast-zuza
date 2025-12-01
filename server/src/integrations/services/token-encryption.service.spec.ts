import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenEncryptionService } from './token-encryption.service';

describe('TokenEncryptionService', () => {
  let service: TokenEncryptionService;
  let configService: jest.Mocked<ConfigService>;

  const mockEncryptionKey =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue(mockEncryptionKey),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenEncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TokenEncryptionService>(TokenEncryptionService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('encrypt', () => {
    it('should encrypt a token successfully', () => {
      const token = 'test-token-123';
      const encrypted = service.encrypt(token);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
      expect(encrypted.split(':')).toHaveLength(2);
      expect(configService.get).toHaveBeenCalledWith('ENCRYPTION_KEY');
    });

    it('should throw error when ENCRYPTION_KEY is not configured', () => {
      configService.get.mockReturnValueOnce(undefined);

      expect(() => service.encrypt('test-token')).toThrow(
        'ENCRYPTION_KEY not configured',
      );
    });

    it('should produce different encrypted values for same token (due to random IV)', () => {
      const token = 'test-token';
      const encrypted1 = service.encrypt(token);
      const encrypted2 = service.encrypt(token);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted token successfully', () => {
      const originalToken = 'test-token-123';
      const encrypted = service.encrypt(originalToken);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
      expect(configService.get).toHaveBeenCalledWith('ENCRYPTION_KEY');
    });

    it('should throw error when ENCRYPTION_KEY is not configured', () => {
      const encrypted = 'iv:encrypted';
      configService.get.mockReturnValueOnce(undefined);

      expect(() => service.decrypt(encrypted)).toThrow(
        'ENCRYPTION_KEY not configured',
      );
    });

    it('should throw error for invalid encrypted token format', () => {
      const invalidEncrypted = 'invalid-format';

      expect(() => service.decrypt(invalidEncrypted)).toThrow(
        'Invalid encrypted token format',
      );
    });

    it('should throw error for encrypted token with missing parts', () => {
      const invalidEncrypted = 'iv-only:';

      expect(() => service.decrypt(invalidEncrypted)).toThrow(
        'Invalid encrypted token format',
      );
    });

    it('should handle empty token', () => {
      const originalToken = '';
      const encrypted = service.encrypt(originalToken);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
    });

    it('should handle long token', () => {
      const originalToken = 'a'.repeat(1000);
      const encrypted = service.encrypt(originalToken);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
    });

    it('should handle special characters in token', () => {
      const originalToken = 'test-token-!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = service.encrypt(originalToken);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
    });
  });
});
