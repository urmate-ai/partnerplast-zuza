import { Test, TestingModule } from '@nestjs/testing';
import { ResponseCacheService } from './response-cache.service';

describe('ResponseCacheService', () => {
  let service: ResponseCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ResponseCacheService,
          useFactory: () => new ResponseCacheService(),
        },
      ],
    }).compile();

    service = module.get<ResponseCacheService>(ResponseCacheService);
  });

  afterEach(() => {
    service.clear();
  });

  describe('constructor', () => {
    it('should create service with default maxSize', () => {
      const defaultService = new ResponseCacheService();
      expect(defaultService).toBeDefined();
    });

    it('should create service with custom maxSize', () => {
      const customService = new ResponseCacheService(50);
      expect(customService).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent key', () => {
      const result = service.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return cached value for existing key', () => {
      const key = 'test-key';
      const value = 'test-value';
      service.set(key, value);

      const result = service.get(key);
      expect(result).toBe(value);
    });
  });

  describe('set', () => {
    it('should store value in cache', () => {
      const key = 'test-key';
      const value = 'test-value';

      service.set(key, value);
      expect(service.get(key)).toBe(value);
    });

    it('should overwrite existing value', () => {
      const key = 'test-key';
      service.set(key, 'old-value');
      service.set(key, 'new-value');

      expect(service.get(key)).toBe('new-value');
    });

    it('should evict oldest entry when maxSize is reached', () => {
      const limitedService = new ResponseCacheService(2);
      limitedService.set('key1', 'value1');
      limitedService.set('key2', 'value2');
      limitedService.set('key3', 'value3');

      expect(limitedService.get('key1')).toBeUndefined();
      expect(limitedService.get('key2')).toBe('value2');
      expect(limitedService.get('key3')).toBe('value3');
    });
  });

  describe('clear', () => {
    it('should remove all entries from cache', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');

      service.clear();

      expect(service.get('key1')).toBeUndefined();
      expect(service.get('key2')).toBeUndefined();
      expect(service.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(service.size()).toBe(0);
    });

    it('should return correct size after adding entries', () => {
      service.set('key1', 'value1');
      expect(service.size()).toBe(1);

      service.set('key2', 'value2');
      expect(service.size()).toBe(2);
    });

    it('should return correct size after clearing', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.clear();

      expect(service.size()).toBe(0);
    });

    it('should not increase size when overwriting', () => {
      service.set('key1', 'value1');
      expect(service.size()).toBe(1);

      service.set('key1', 'value2');
      expect(service.size()).toBe(1);
    });
  });

  describe('evictOldest', () => {
    it('should evict first entry when cache is full', () => {
      const limitedService = new ResponseCacheService(3);
      limitedService.set('key1', 'value1');
      limitedService.set('key2', 'value2');
      limitedService.set('key3', 'value3');

      // Adding 4th entry should evict key1
      limitedService.set('key4', 'value4');

      expect(limitedService.get('key1')).toBeUndefined();
      expect(limitedService.get('key2')).toBe('value2');
      expect(limitedService.get('key3')).toBe('value3');
      expect(limitedService.get('key4')).toBe('value4');
      expect(limitedService.size()).toBe(3);
    });
  });
});
