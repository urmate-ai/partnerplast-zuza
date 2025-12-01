import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

type StateData = {
  userId: string;
  expiresAt: number;
};

@Injectable()
export class OAuthStateService {
  private readonly logger = new Logger(OAuthStateService.name);
  private readonly stateStore = new Map<string, StateData>();
  private readonly stateExpirationMs = 10 * 60 * 1000; // 10 minutes
  private readonly cleanupIntervalMs = 10 * 60 * 1000; // 10 minutes

  constructor() {
    setInterval(() => this.cleanupExpiredStates(), this.cleanupIntervalMs);
  }

  generate(userId: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      userId,
      expiresAt: Date.now() + this.stateExpirationMs,
    });
    return state;
  }

  validateAndConsume(state: string): string {
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }

    if (Date.now() > stateData.expiresAt) {
      this.stateStore.delete(state);
      throw new Error('State parameter has expired');
    }

    this.stateStore.delete(state);
    return stateData.userId;
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
