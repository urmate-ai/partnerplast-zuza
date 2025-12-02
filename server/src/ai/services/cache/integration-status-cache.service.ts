import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IntegrationStatusCacheService {
  private readonly logger = new Logger(IntegrationStatusCacheService.name);
  private readonly cache = new Map<
    string,
    {
      isGmailConnected: boolean;
      isCalendarConnected: boolean;
      timestamp: number;
    }
  >();
  private readonly TTL = 5 * 60 * 1000;

  get(userId: string): {
    isGmailConnected: boolean;
    isCalendarConnected: boolean;
  } | null {
    const cached = this.cache.get(userId);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }

    return {
      isGmailConnected: cached.isGmailConnected,
      isCalendarConnected: cached.isCalendarConnected,
    };
  }

  set(
    userId: string,
    isGmailConnected: boolean,
    isCalendarConnected: boolean,
  ): void {
    this.cache.set(userId, {
      isGmailConnected,
      isCalendarConnected,
      timestamp: Date.now(),
    });
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(userId);
      }
    }
  }
}
