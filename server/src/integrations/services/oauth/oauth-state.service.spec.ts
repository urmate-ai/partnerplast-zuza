import { Test, TestingModule } from '@nestjs/testing';
import { OAuthStateService } from './oauth-state.service';

describe('OAuthStateService', () => {
  let service: OAuthStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OAuthStateService],
    }).compile();

    service = module.get<OAuthStateService>(OAuthStateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    if (service) {
      service.onModuleDestroy();
    }
  });

  describe('generate', () => {
    it('should generate a unique state string', () => {
      const userId = 'user-123';
      const state = service.generate(userId);

      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate different states for same user', () => {
      const userId = 'user-123';
      const state1 = service.generate(userId);
      const state2 = service.generate(userId);

      expect(state1).not.toBe(state2);
    });

    it('should generate different states for different users', () => {
      const state1 = service.generate('user-1');
      const state2 = service.generate('user-2');

      expect(state1).not.toBe(state2);
    });
  });

  describe('validateAndConsume', () => {
    it('should return userId for valid state', () => {
      const userId = 'user-123';
      const state = service.generate(userId);
      const validatedUserId = service.validateAndConsume(state);

      expect(validatedUserId).toBe(userId);
    });

    it('should throw error for invalid state', () => {
      const invalidState = 'invalid-state';

      expect(() => service.validateAndConsume(invalidState)).toThrow(
        'Invalid or expired state parameter',
      );
    });

    it('should throw error for already consumed state', () => {
      const userId = 'user-123';
      const state = service.generate(userId);
      service.validateAndConsume(state);

      expect(() => service.validateAndConsume(state)).toThrow(
        'Invalid or expired state parameter',
      );
    });

    it('should throw error for expired state', () => {
      jest.useFakeTimers();
      const userId = 'user-123';
      const state = service.generate(userId);

      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      expect(() => service.validateAndConsume(state)).toThrow(
        'State parameter has expired',
      );
    });

    it('should delete state after validation', () => {
      const userId = 'user-123';
      const state = service.generate(userId);
      service.validateAndConsume(state);

      expect(() => service.validateAndConsume(state)).toThrow(
        'Invalid or expired state parameter',
      );
    });
  });

  describe('cleanupExpiredStates', () => {
    it('should cleanup expired states', () => {
      jest.useFakeTimers();
      const userId = 'user-123';
      const state = service.generate(userId);

      jest.advanceTimersByTime(10 * 60 * 1000 + 1000);

      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(() => service.validateAndConsume(state)).toThrow(
        'State parameter has expired',
      );
    });
  });
});
