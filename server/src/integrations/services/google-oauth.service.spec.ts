import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleOAuthService } from './google-oauth.service';
import { TokenEncryptionService } from './token-encryption.service';
import { OAuthStateService } from './oauth-state.service';
import { google } from 'googleapis';
import type { Integration, UserIntegration } from '@prisma/client';

jest.mock('googleapis');

describe('GoogleOAuthService', () => {
  let service: GoogleOAuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let tokenEncryption: jest.Mocked<TokenEncryptionService>;
  let stateService: jest.Mocked<OAuthStateService>;

  const mockClientId = 'test-client-id';
  const mockClientSecret = 'test-client-secret';
  const mockUserId = 'user-123';
  const mockIntegrationId = 'integration-123';
  const mockState = 'test-state-123';

  const mockIntegration: Integration = {
    id: mockIntegrationId,
    name: 'Gmail',
    description: 'Test',
    icon: 'mail',
    category: 'communication',
    config: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserIntegration: UserIntegration = {
    id: 'user-integration-123',
    userId: mockUserId,
    integrationId: mockIntegrationId,
    isConnected: true,
    accessToken: 'encrypted-access-token',
    refreshToken: 'encrypted-refresh-token',
    tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
    scopes: ['scope1', 'scope2'],
    metadata: { email: 'test@example.com' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return mockClientId;
        if (key === 'GOOGLE_CLIENT_SECRET') return mockClientSecret;
        if (key === 'PUBLIC_URL') return 'http://localhost:3000';
        return undefined;
      }),
    };

    const mockPrismaService = {
      integration: {
        findFirst: jest.fn(),
      },
      userIntegration: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockTokenEncryption = {
      encrypt: jest.fn((token: string) => `encrypted-${token}`),
      decrypt: jest.fn((encrypted: string) =>
        encrypted.replace('encrypted-', ''),
      ),
    };

    const mockStateService = {
      generate: jest.fn(() => mockState),
      validateAndConsume: jest.fn(() => mockUserId),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleOAuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TokenEncryptionService,
          useValue: mockTokenEncryption,
        },
        {
          provide: OAuthStateService,
          useValue: mockStateService,
        },
      ],
    }).compile();

    service = module.get<GoogleOAuthService>(GoogleOAuthService);
    prismaService = module.get(PrismaService);
    tokenEncryption = module.get(TokenEncryptionService);
    stateService = module.get(OAuthStateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate auth URL successfully', () => {
      const scopes = ['scope1', 'scope2'];
      const redirectPath = '/api/v1/integrations/gmail/callback';
      const mockAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';

      const mockOAuth2Client = {
        generateAuthUrl: jest.fn(() => mockAuthUrl),
      };

      (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(
        () => mockOAuth2Client,
      );

      const result = service.generateAuthUrl(mockUserId, scopes, redirectPath);

      expect(result.authUrl).toBe(mockAuthUrl);
      expect(result.state).toBe(mockState);
      expect(stateService.generate).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('handleCallback', () => {
    it('should handle callback successfully', async () => {
      const code = 'auth-code-123';
      const mockTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expiry_date: Date.now() + 3600 * 1000,
        scope: 'scope1 scope2',
      };

      const mockOAuth2Client = {
        getToken: jest.fn().mockResolvedValue({ tokens: mockTokens }),
      };

      (
        service as unknown as { oauth2Client: typeof mockOAuth2Client }
      ).oauth2Client = mockOAuth2Client as never;

      const result = await service.handleCallback(code, mockState);

      expect(result.userId).toBe(mockUserId);
      expect(result.tokens.access_token).toBe(mockTokens.access_token);
      expect(stateService.validateAndConsume).toHaveBeenCalledWith(mockState);
    });

    it('should throw error when no access token received', async () => {
      const code = 'auth-code-123';
      const mockTokens = {
        access_token: undefined,
      };

      const mockOAuth2Client = {
        getToken: jest.fn().mockResolvedValue({ tokens: mockTokens }),
      };

      (
        service as unknown as { oauth2Client: typeof mockOAuth2Client }
      ).oauth2Client = mockOAuth2Client as never;

      await expect(service.handleCallback(code, mockState)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAuthenticatedClient', () => {
    it('should return authenticated client when integration exists and is connected', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        mockUserIntegration,
      );

      const mockOAuth2Client = {
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn(),
      };

      (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(
        () => mockOAuth2Client,
      );

      const result = await service.getAuthenticatedClient(mockUserId, 'Gmail');

      expect(result.client).toBeDefined();
      expect(result.integrationId).toBe(mockIntegrationId);
    });

    it('should throw NotFoundException when integration not found', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.getAuthenticatedClient(mockUserId, 'Gmail'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when not connected', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        {
          ...mockUserIntegration,
          isConnected: false,
        },
      );

      await expect(
        service.getAuthenticatedClient(mockUserId, 'Gmail'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('disconnect', () => {
    it('should disconnect integration successfully', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        mockUserIntegration,
      );

      const mockOAuth2Client = {
        revokeToken: jest.fn().mockResolvedValue(undefined),
      };

      (
        service as unknown as { oauth2Client: typeof mockOAuth2Client }
      ).oauth2Client = mockOAuth2Client as never;

      await service.disconnect(mockUserId, 'Gmail');

      expect(
        prismaService.userIntegration.delete as jest.Mock,
      ).toHaveBeenCalled();
    });

    it('should throw NotFoundException when integration not found', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.disconnect(mockUserId, 'Gmail')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('saveUserIntegration', () => {
    it('should save user integration successfully', async () => {
      const userIntegrationData = {
        userId: mockUserId,
        integrationId: mockIntegrationId,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenExpiresAt: new Date(),
        scopes: ['scope1'],
        metadata: { email: 'test@example.com' },
      };

      await service.saveUserIntegration(userIntegrationData);

      expect(tokenEncryption.encrypt).toHaveBeenCalledWith('access-token');
      expect(
        prismaService.userIntegration.upsert as jest.Mock,
      ).toHaveBeenCalled();
    });
  });
});
