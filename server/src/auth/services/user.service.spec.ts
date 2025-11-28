import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserProfile, UpdateProfileData, UpdateNotificationsData } from '../types/auth.types';

describe('UserService', () => {
  let service: UserService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUserId = 'user-123';
  const mockUserProfile: UserProfile = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',      
    provider: 'local',
    pushNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('powinien zwrócić profil użytkownika', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUserProfile as any);

      const result = await service.getProfile(mockUserId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: {
          id: true,
          email: true,
          name: true,
          provider: true,
          pushNotifications: true,
          emailNotifications: true,
          soundEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUserProfile);
    });

    it('powinien rzucić NotFoundException gdy użytkownik nie istnieje', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getProfile(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('powinien zaktualizować profil użytkownika', async () => {
      const updateData: UpdateProfileData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUserProfile,
        ...updateData,
      } as any);

      const result = await service.updateProfile(mockUserId, updateData);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: updateData.email,
          id: { not: mockUserId },
        },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: updateData,
        select: expect.any(Object),
      });
      expect(result.name).toBe(updateData.name);
      expect(result.email).toBe(updateData.email);
    });

    it('powinien rzucić ConflictException gdy email jest już używany', async () => {
      const updateData: UpdateProfileData = {
        email: 'existing@example.com',
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'other-user',
        email: 'existing@example.com',
      } as any);

      await expect(service.updateProfile(mockUserId, updateData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('powinien zaktualizować tylko podane pola', async () => {
      const updateData: UpdateProfileData = {
        name: 'New Name',
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUserProfile,
        name: 'New Name',
      } as any);

      await service.updateProfile(mockUserId, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { name: 'New Name' },
        select: expect.any(Object),
      });
    });
  });

  describe('updateNotifications', () => {
    it('powinien zaktualizować ustawienia powiadomień', async () => {
      const updateData: UpdateNotificationsData = {
        pushNotifications: false,
        emailNotifications: true,
        soundEnabled: false,
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUserProfile,
        ...updateData,
      } as any);

      const result = await service.updateNotifications(mockUserId, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: updateData,
        select: expect.any(Object),
      });
      expect(result.pushNotifications).toBe(false);
      expect(result.emailNotifications).toBe(true);
      expect(result.soundEnabled).toBe(false);
    });
  });

  describe('logout', () => {
    it('powinien zaktualizować lastLogoutAt', async () => {
      (prismaService.user.update as jest.Mock).mockResolvedValue({} as any);

      const result = await service.logout(mockUserId);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          lastLogoutAt: expect.any(Date),
        },
      });
      expect(result.message).toBe('Wylogowano pomyślnie');
    });
  });

  describe('getAllUsers', () => {
    it('powinien zwrócić wszystkich użytkowników', async () => {
      const mockUsers = [mockUserProfile, { ...mockUserProfile, id: 'user-456' }];

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers as any);

      const result = await service.getAllUsers();

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          provider: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('validateUser', () => {
    it('powinien zwrócić użytkownika gdy token jest ważny', async () => {
      const payload = { sub: mockUserId, iat: Math.floor(Date.now() / 1000) };
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        lastLogoutAt: null,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);

      const result = await service.validateUser(payload);

      expect(result).toEqual(mockUser);
    });

    it('powinien zwrócić null gdy użytkownik nie istnieje', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser({ sub: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('powinien zwrócić null gdy token został wydany przed wylogowaniem', async () => {
      const lastLogoutAt = new Date('2024-01-15T10:00:00Z');
      const tokenIssuedAt = Math.floor(new Date('2024-01-15T09:00:00Z').getTime() / 1000);
      const payload = { sub: mockUserId, iat: tokenIssuedAt };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        lastLogoutAt,
      } as any);

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });
  });
});

