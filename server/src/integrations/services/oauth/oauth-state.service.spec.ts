import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { OAuthStateService } from './oauth-state.service';

describe('OAuthStateService', () => {
  let service: OAuthStateService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      oAuthState: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthStateService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OAuthStateService>(OAuthStateService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    if (service) {
      service.onModuleDestroy();
    }
  });

  describe('generate', () => {
    it('should generate a unique state string', async () => {
      const userId = 'user-123';
      const mockState = 'generated-state-123';
      const mockExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      (prismaService.oAuthState.create as jest.Mock).mockResolvedValue({
        state: mockState,
        userId,
        expiresAt: mockExpiresAt,
      });

      const state = await service.generate(userId);

      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
      expect(prismaService.oAuthState.create).toHaveBeenCalled();
    });

    it('should generate different states for same user', async () => {
      const userId = 'user-123';

      (prismaService.oAuthState.create as jest.Mock)
        .mockResolvedValueOnce({
          state: 'state-1',
          userId,
          expiresAt: new Date(),
        })
        .mockResolvedValueOnce({
          state: 'state-2',
          userId,
          expiresAt: new Date(),
        });

      const state1 = await service.generate(userId);
      const state2 = await service.generate(userId);

      expect(state1).not.toBe(state2);
    });

    it('should generate different states for different users', async () => {
      (prismaService.oAuthState.create as jest.Mock)
        .mockResolvedValueOnce({
          state: 'state-1',
          userId: 'user-1',
          expiresAt: new Date(),
        })
        .mockResolvedValueOnce({
          state: 'state-2',
          userId: 'user-2',
          expiresAt: new Date(),
        });

      const state1 = await service.generate('user-1');
      const state2 = await service.generate('user-2');

      expect(state1).not.toBe(state2);
    });
  });

  describe('validateAndConsume', () => {
    it('should return userId and redirectUri for valid state', async () => {
      const userId = 'user-123';
      const state = 'valid-state-123';
      const mockStateData = {
        state,
        userId,
        redirectUri: null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      (prismaService.oAuthState.findUnique as jest.Mock).mockResolvedValue(
        mockStateData,
      );
      (prismaService.oAuthState.delete as jest.Mock).mockResolvedValue(
        mockStateData,
      );

      const result = await service.validateAndConsume(state);

      expect(result.userId).toBe(userId);
      expect(result.redirectUri).toBeUndefined();
      expect(prismaService.oAuthState.delete).toHaveBeenCalled();
    });

    it('should return userId and redirectUri when redirectUri was provided', async () => {
      const userId = 'user-123';
      const redirectUri = 'exp://192.168.0.23:8081/--/integrations';
      const state = 'valid-state-123';
      const mockStateData = {
        state,
        userId,
        redirectUri,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      (prismaService.oAuthState.findUnique as jest.Mock).mockResolvedValue(
        mockStateData,
      );
      (prismaService.oAuthState.delete as jest.Mock).mockResolvedValue(
        mockStateData,
      );

      const result = await service.validateAndConsume(state);

      expect(result.userId).toBe(userId);
      expect(result.redirectUri).toBe(redirectUri);
    });

    it('should throw error for invalid state', async () => {
      const invalidState = 'invalid-state';

      (prismaService.oAuthState.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.oAuthState.count as jest.Mock).mockResolvedValue(0);

      await expect(service.validateAndConsume(invalidState)).rejects.toThrow(
        'Invalid or expired state parameter',
      );
    });

    it('should throw error for already consumed state', async () => {
      const state = 'consumed-state-123';

      (prismaService.oAuthState.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.oAuthState.count as jest.Mock).mockResolvedValue(0);

      await expect(service.validateAndConsume(state)).rejects.toThrow(
        'Invalid or expired state parameter',
      );
    });

    it('should throw error for expired state', async () => {
      jest.useFakeTimers();
      const state = 'expired-state-123';
      const expiredStateData = {
        state,
        userId: 'user-123',
        redirectUri: null,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      (prismaService.oAuthState.findUnique as jest.Mock).mockResolvedValue(
        expiredStateData,
      );
      (prismaService.oAuthState.delete as jest.Mock).mockResolvedValue(
        expiredStateData,
      );

      await expect(service.validateAndConsume(state)).rejects.toThrow(
        'State parameter has expired',
      );

      jest.useRealTimers();
    });

    it('should delete state after validation', async () => {
      const state = 'state-to-delete-123';
      const mockStateData = {
        state,
        userId: 'user-123',
        redirectUri: null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      (prismaService.oAuthState.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockStateData)
        .mockResolvedValueOnce(null);
      (prismaService.oAuthState.delete as jest.Mock).mockResolvedValue(
        mockStateData,
      );
      (prismaService.oAuthState.count as jest.Mock).mockResolvedValue(0);

      await service.validateAndConsume(state);

      // Second call should fail because state was deleted
      await expect(service.validateAndConsume(state)).rejects.toThrow(
        'Invalid or expired state parameter',
      );
    });
  });

  describe('cleanupExpiredStates', () => {
    it('should cleanup expired states', async () => {
      jest.useFakeTimers();
      const state = 'expired-state-123';
      const expiredStateData = {
        state,
        userId: 'user-123',
        redirectUri: null,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      (prismaService.oAuthState.findUnique as jest.Mock).mockResolvedValue(
        expiredStateData,
      );
      (prismaService.oAuthState.delete as jest.Mock).mockResolvedValue(
        expiredStateData,
      );
      (prismaService.oAuthState.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      await expect(service.validateAndConsume(state)).rejects.toThrow(
        'State parameter has expired',
      );

      jest.useRealTimers();
    });
  });
});
