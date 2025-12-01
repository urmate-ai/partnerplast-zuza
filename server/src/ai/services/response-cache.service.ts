import { Injectable } from '@nestjs/common';

type CacheKey = string;
type CacheValue = string;

@Injectable()
export class ResponseCacheService {
  private readonly cache = new Map<CacheKey, CacheValue>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: CacheKey): CacheValue | undefined {
    return this.cache.get(key);
  }

  set(key: CacheKey, value: CacheValue): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value as CacheKey | undefined;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }
}
