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

    try {
      await this.prisma.oAuthState.create({
        data: {
          state,
          userId,
          redirectUri: redirectUri || null,
          expiresAt,
        },
      });

      this.logger.debug(
        `Generated OAuth state: ${state.substring(0, 16)}... for user ${userId}, expiresAt=${expiresAt.toISOString()}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : undefined;

      if (errorCode === 'P2021' || errorMessage.includes('does not exist')) {
        this.logger.error(
          `OAuth states table does not exist. Please run migrations: npx prisma migrate deploy`,
        );
        throw new Error(
          'Database migration required. Please run: npx prisma migrate deploy',
        );
      }
      this.logger.error(
        `Failed to create OAuth state for user ${userId}:`,
        error,
      );
      throw error;
    }

    return state;
  }

  async validateAndConsume(
    state: string,
  ): Promise<{ userId: string; redirectUri?: string }> {
    this.logger.debug(`Validating state: ${state.substring(0, 16)}...`);

    const stateData = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!stateData) {
      this.logger.warn(
        `State not found in database: ${state.substring(0, 16)}...`,
      );
      const count = await this.prisma.oAuthState.count();
      this.logger.debug(`Total OAuth states in database: ${count}`);
      throw new Error('Invalid or expired state parameter');
    }

    this.logger.debug(
      `State found: userId=${stateData.userId}, expiresAt=${stateData.expiresAt.toISOString()}`,
    );

    const now = new Date();
    if (now > stateData.expiresAt) {
      this.logger.warn(
        `State expired: now=${now.toISOString()}, expiresAt=${stateData.expiresAt.toISOString()}`,
      );
      await this.prisma.oAuthState.delete({
        where: { state },
      });
      throw new Error('State parameter has expired');
    }

    await this.prisma.oAuthState.delete({
      where: { state },
    });

    this.logger.debug(
      `State validated and consumed successfully for user ${stateData.userId}`,
    );

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
