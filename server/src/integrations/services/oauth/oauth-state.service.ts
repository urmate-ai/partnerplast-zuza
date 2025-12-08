import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as crypto from 'crypto';

type StateData = {
  userId: string;
  redirectUri?: string;
  expiresAt: number;
};

@Injectable()
export class OAuthStateService implements OnModuleDestroy {
  private readonly logger = new Logger(OAuthStateService.name);
  private readonly stateStore = new Map<string, StateData>();
  private readonly stateExpirationMs = 10 * 60 * 1000; // 10 minutes
  private readonly cleanupIntervalMs = 10 * 60 * 1000; // 10 minutes
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(
      () => this.cleanupExpiredStates(),
      this.cleanupIntervalMs,
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  generate(userId: string, redirectUri?: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      userId,
      redirectUri,
      expiresAt: Date.now() + this.stateExpirationMs,
    });
    return state;
  }

  validateAndConsume(state: string): { userId: string; redirectUri?: string } {
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }

    if (Date.now() > stateData.expiresAt) {
      this.stateStore.delete(state);
      throw new Error('State parameter has expired');
    }

    this.stateStore.delete(state);
    return { userId: stateData.userId, redirectUri: stateData.redirectUri };
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [state, data] of this.stateStore.entries()) {
      if (now > data.expiresAt) {
        this.stateStore.delete(state);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired OAuth states`);
    }
  }
}
