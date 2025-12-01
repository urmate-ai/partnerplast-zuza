import { Test, TestingModule } from '@nestjs/testing';
import { GoogleIntegrationService } from './google-integration.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Integration, UserIntegration } from '@prisma/client';

describe('GoogleIntegrationService', () => {
  let service: GoogleIntegrationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUserId = 'user-123';
  const mockIntegrationId = 'integration-123';
  const mockIntegrationName = 'Gmail';

  const mockIntegration: Integration = {
    id: mockIntegrationId,
    name: mockIntegrationName,
    description: 'Test integration',
    icon: 'mail',
    config: {},
    category: 'communication',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserIntegration: UserIntegration = {
    id: 'user-integration-123',
    userId: mockUserId,
    integrationId: mockIntegrationId,
    isConnected: true,
    accessToken: 'encrypted-token',
    refreshToken: 'encrypted-refresh-token',
    tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
    scopes: ['scope1', 'scope2'],
    metadata: {
      email: 'test@example.com',
      timezone: 'Europe/Warsaw',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      integration: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      userIntegration: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleIntegrationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GoogleIntegrationService>(GoogleIntegrationService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateIntegration', () => {
    it('should return existing integration if found', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );

      const result = await service.findOrCreateIntegration({
        name: mockIntegrationName,
        description: 'Test',
        icon: 'mail',
        category: 'communication',
      });

      expect(result).toEqual({ id: mockIntegrationId });
      expect(prismaService.integration.findFirst).toHaveBeenCalledWith({
        where: { name: mockIntegrationName },
      });
      expect(prismaService.integration.create).not.toHaveBeenCalled();
    });

    it('should create new integration if not found', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.integration.create as jest.Mock).mockResolvedValue(
        mockIntegration,
      );

      const config = {
        name: mockIntegrationName,
        description: 'Test',
        icon: 'mail',
        category: 'communication',
      };

      const result = await service.findOrCreateIntegration(config);

      expect(result).toEqual({ id: mockIntegrationId });
      expect(prismaService.integration.findFirst).toHaveBeenCalledWith({
        where: { name: mockIntegrationName },
      });
      expect(prismaService.integration.create).toHaveBeenCalledWith({
        data: {
          ...config,
          isActive: true,
        },
      });
    });
  });

  describe('getConnectionStatus', () => {
    it('should return isConnected: false when integration not found', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.getConnectionStatus(
        mockUserId,
        mockIntegrationName,
      );

      expect(result).toEqual({ isConnected: false });
      expect(prismaService.integration.findFirst).toHaveBeenCalledWith({
        where: { name: mockIntegrationName },
      });
    });

    it('should return isConnected: false when userIntegration not found', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.getConnectionStatus(
        mockUserId,
        mockIntegrationName,
      );

      expect(result).toEqual({ isConnected: false });
    });

    it('should return isConnected: false when not connected', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        {
          ...mockUserIntegration,
          isConnected: false,
        },
      );

      const result = await service.getConnectionStatus(
        mockUserId,
        mockIntegrationName,
      );

      expect(result).toEqual({ isConnected: false });
    });

    it('should return connection status when connected', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        mockUserIntegration,
      );

      const result = await service.getConnectionStatus(
        mockUserId,
        mockIntegrationName,
      );

      expect(result).toEqual({
        isConnected: true,
        email: 'test@example.com',
        connectedAt: mockUserIntegration.createdAt,
        scopes: ['scope1', 'scope2'],
        timezone: 'Europe/Warsaw',
      });
    });

    it('should handle missing metadata fields', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        {
          ...mockUserIntegration,
          metadata: {},
        },
      );

      const result = await service.getConnectionStatus(
        mockUserId,
        mockIntegrationName,
      );

      expect(result).toEqual({
        isConnected: true,
        email: undefined,
        connectedAt: mockUserIntegration.createdAt,
        scopes: ['scope1', 'scope2'],
        timezone: undefined,
      });
    });

    it('should handle null metadata', async () => {
      (prismaService.integration.findFirst as jest.Mock).mockResolvedValue(
        mockIntegration,
      );
      (prismaService.userIntegration.findUnique as jest.Mock).mockResolvedValue(
        {
          ...mockUserIntegration,
          metadata: null,
        },
      );

      const result = await service.getConnectionStatus(
        mockUserId,
        mockIntegrationName,
      );

      expect(result).toEqual({
        isConnected: true,
        email: undefined,
        connectedAt: mockUserIntegration.createdAt,
        scopes: ['scope1', 'scope2'],
        timezone: undefined,
      });
    });
  });
});
