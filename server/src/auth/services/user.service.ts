import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserProfile, UpdateProfileData, UpdateNotificationsData } from '../types/auth.types';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new NotFoundException('Użytkownik nie został znaleziony');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: UpdateProfileData): Promise<Omit<UserProfile, 'pushNotifications' | 'emailNotifications' | 'soundEnabled'>> {
    if (updateData.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email jest już używany przez innego użytkownika');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.email && { email: updateData.email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Profile updated for user: ${userId}`);
    return updatedUser;
  }

  async updateNotifications(userId: string, updateData: UpdateNotificationsData): Promise<UserProfile> {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.pushNotifications !== undefined && {
          pushNotifications: updateData.pushNotifications,
        }),
        ...(updateData.emailNotifications !== undefined && {
          emailNotifications: updateData.emailNotifications,
        }),
        ...(updateData.soundEnabled !== undefined && {
          soundEnabled: updateData.soundEnabled,
        }),
      },
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

    this.logger.log(`Notifications updated for user: ${userId}`);
    return updatedUser;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLogoutAt: new Date(),
      },
    });
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Wylogowano pomyślnie' };
  }

  async getAllUsers(): Promise<Array<Pick<UserProfile, 'id' | 'email' | 'name' | 'provider' | 'createdAt' | 'updatedAt'>>> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async validateUser(payload: { sub: string; iat?: number }): Promise<{ id: string; email: string; name: string; lastLogoutAt: Date | null } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        lastLogoutAt: true,
      },
    });

    if (!user) {
      return null;
    }

    if (user.lastLogoutAt && payload.iat !== undefined) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < user.lastLogoutAt) {
        this.logger.warn(`Token invalidated for user ${user.id} - token issued before last logout`);
        return null;
      }
    }

    return user;
  }
}

