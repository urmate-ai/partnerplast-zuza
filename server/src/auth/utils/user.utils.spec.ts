import { UserUtils } from './user.utils';
import type { User } from '@prisma/client';

describe('UserUtils', () => {
  describe('isLocalUser', () => {
    it('powinien zwrócić true dla użytkownika lokalnego z hasłem', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        provider: 'local',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentChatId: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastLogoutAt: null,
        pushNotifications: true,
        emailNotifications: true,
        soundEnabled: true,
      };

      expect(UserUtils.isLocalUser(user)).toBe(true);
    });

    it('powinien zwrócić false dla użytkownika OAuth', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: null,
        provider: 'google',
        providerId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentChatId: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastLogoutAt: null,
        pushNotifications: true,
        emailNotifications: true,
        soundEnabled: true,
      };

      expect(UserUtils.isLocalUser(user)).toBe(false);
    });

    it('powinien zwrócić false dla null', () => {
      expect(UserUtils.isLocalUser(null)).toBe(false);
    });
  });

  describe('isOAuthUser', () => {
    it('powinien zwrócić true dla użytkownika OAuth', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: null,
        provider: 'google',
        providerId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        currentChatId: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastLogoutAt: null,
        pushNotifications: true,
        emailNotifications: true,
        soundEnabled: true,
      };

      expect(UserUtils.isOAuthUser(user)).toBe(true);
    });

    it('powinien zwrócić false dla użytkownika lokalnego', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        provider: 'local',
        providerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentChatId: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastLogoutAt: null,
        pushNotifications: true,
        emailNotifications: true,
        soundEnabled: true,
      };

      expect(UserUtils.isOAuthUser(user)).toBe(false);
    });
  });

  describe('extractEmailFromGoogleProfile', () => {
    it('powinien wyodrębnić email z profilu Google', () => {
      const emails = [{ value: 'test@example.com' }];

      expect(UserUtils.extractEmailFromGoogleProfile(emails)).toBe(
        'test@example.com',
      );
    });

    it('powinien zwrócić null gdy brak emaili', () => {
      expect(UserUtils.extractEmailFromGoogleProfile(undefined)).toBeNull();
      expect(UserUtils.extractEmailFromGoogleProfile([])).toBeNull();
    });

    it('powinien zwrócić pierwszy email z tablicy', () => {
      const emails = [
        { value: 'first@example.com' },
        { value: 'second@example.com' },
      ];

      expect(UserUtils.extractEmailFromGoogleProfile(emails)).toBe(
        'first@example.com',
      );
    });
  });
});
