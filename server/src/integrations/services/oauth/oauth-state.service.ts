import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class OAuthStateService implements OnModuleDestroy {
  private readonly logger = new Logger(OAuthStateService.name);
  private readonly stateExpirationMs = 10 * 60 * 1000;
  private readonly cleanupIntervalMs = 10 * 60 * 1000;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
    this.cleanupInterval = setInterval(() => {
      void this.cleanupExpiredStates();
    }, this.cleanupIntervalMs);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  async generate(userId: string, redirectUri?: string): Promise<string> {
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.stateExpirationMs);

    await this.prisma.oAuthState.create({
      data: {
        state,
        userId,
        redirectUri: redirectUri || null,
        expiresAt,
      },
    });

    return state;
  }

  async validateAndConsume(
    state: string,
  ): Promise<{ userId: string; redirectUri?: string }> {
    const stateData = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }

    if (new Date() > stateData.expiresAt) {
      await this.prisma.oAuthState.delete({
        where: { state },
      });
      throw new Error('State parameter has expired');
    }

    await this.prisma.oAuthState.delete({
      where: { state },
    });

    return {
      userId: stateData.userId,
      redirectUri: stateData.redirectUri || undefined,
    };
  }

  private async cleanupExpiredStates(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.prisma.oAuthState.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      if (result.count > 0) {
        this.logger.debug(`Cleaned up ${result.count} expired OAuth states`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired OAuth states:', error);
    }
  }
}
