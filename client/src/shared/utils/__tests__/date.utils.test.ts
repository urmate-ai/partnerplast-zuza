import { formatMessageTime } from '../date.utils';

describe('date.utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatMessageTime', () => {
    it('should return "Teraz" for messages less than 1 minute old', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const dateString = new Date('2024-01-01T11:59:30Z').toISOString();
      expect(formatMessageTime(dateString)).toBe('Teraz');
    });

    it('should return minutes ago for messages less than 60 minutes old', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const dateString = new Date('2024-01-01T11:45:00Z').toISOString();
      expect(formatMessageTime(dateString)).toBe('15 min temu');
    });

    it('should return hours ago for messages less than 24 hours old', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const dateString = new Date('2024-01-01T10:00:00Z').toISOString();
      expect(formatMessageTime(dateString)).toBe('2 godz. temu');
    });

    it('should return formatted date for messages older than 24 hours', () => {
      const now = new Date('2024-01-05T12:00:00Z');
      jest.setSystemTime(now);

      const dateString = new Date('2024-01-01T10:30:00Z').toISOString();
      const result = formatMessageTime(dateString);
      
      expect(result).toMatch(/\d{1,2}\s\w{3}[,\s]\s?\d{2}:\d{2}/);
      expect(result).not.toBe('Teraz');
      expect(result).not.toContain('min temu');
      expect(result).not.toContain('godz. temu');
    });

    it('should handle date string input correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const dateString = '2024-01-01T11:30:00Z';
      expect(formatMessageTime(dateString)).toBe('30 min temu');
    });

    it('should handle Date object input correctly', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      jest.setSystemTime(now);

      const date = new Date('2024-01-01T11:30:00Z');
      expect(formatMessageTime(date.toISOString())).toBe('30 min temu');
    });
  });
});

