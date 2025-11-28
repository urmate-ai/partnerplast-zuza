import { isValidIconName, getSafeIconName } from '../icon.utils';

describe('icon.utils', () => {
  describe('isValidIconName', () => {
    it('should return false for undefined', () => {
      expect(isValidIconName(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidIconName('')).toBe(false);
    });

    it('should return true for non-empty string', () => {
      expect(isValidIconName('home-outline')).toBe(true);
    });

    it('should return true for valid icon name', () => {
      expect(isValidIconName('chatbubble-outline')).toBe(true);
    });
  });

  describe('getSafeIconName', () => {
    it('should return icon name if valid', () => {
      expect(getSafeIconName('home-outline', 'link-outline')).toBe('home-outline');
    });

    it('should return fallback if icon name is undefined', () => {
      expect(getSafeIconName(undefined, 'link-outline')).toBe('link-outline');
    });

    it('should return fallback if icon name is empty string', () => {
      expect(getSafeIconName('', 'link-outline')).toBe('link-outline');
    });

    it('should use default fallback if not provided', () => {
      expect(getSafeIconName(undefined)).toBe('link-outline');
    });

    it('should use custom fallback if provided', () => {
      expect(getSafeIconName(undefined, 'home-outline')).toBe('home-outline');
    });
  });
});

