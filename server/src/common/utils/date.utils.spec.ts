import { DateUtils } from './date.utils';

describe('DateUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatRelativeTimestamp', () => {
    it('powinien zwrócić "Teraz" dla daty mniej niż godzinę temu', () => {
      const date = new Date('2024-01-15T11:30:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('Teraz');
    });

    it('powinien zwrócić "Dzisiaj" dla daty dzisiaj', () => {
      const date = new Date('2024-01-15T08:00:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('Dzisiaj');
    });

    it('powinien zwrócić "Wczoraj" dla daty wczoraj', () => {
      const date = new Date('2024-01-14T12:00:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('Wczoraj');
    });

    it('powinien zwrócić "X dni temu" dla daty kilka dni temu', () => {
      const date = new Date('2024-01-10T12:00:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('5 dni temu');
    });

    it('powinien zwrócić "Tydzień temu" dla daty tydzień temu', () => {
      const date = new Date('2024-01-08T12:00:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('Tydzień temu');
    });

    it('powinien zwrócić "X tygodnie temu" dla daty kilka tygodni temu', () => {
      const date = new Date('2023-12-25T12:00:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('3 tygodnie temu');
    });

    it('powinien zwrócić "Miesiąc temu" dla daty miesiąc temu', () => {
      const date = new Date('2023-12-15T12:00:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('Miesiąc temu');
    });

    it('powinien zwrócić "X miesiące temu" dla daty kilka miesięcy temu', () => {
      const date = new Date('2023-10-15T12:00:00Z');
      expect(DateUtils.formatRelativeTimestamp(date)).toBe('3 miesiące temu');
    });

    it('powinien obsłużyć string ISO', () => {
      const dateString = '2024-01-14T12:00:00Z';
      expect(DateUtils.formatRelativeTimestamp(dateString)).toBe('Wczoraj');
    });
  });

  describe('addHours', () => {
    it('powinien dodać określoną liczbę godzin do aktualnej daty', () => {
      const hours = 5;
      const result = DateUtils.addHours(hours);
      const expected = new Date('2024-01-15T17:00:00Z');

      expect(result.getTime()).toBe(expected.getTime());
    });

    it('powinien obsłużyć ujemne wartości', () => {
      const hours = -2;
      const result = DateUtils.addHours(hours);
      const expected = new Date('2024-01-15T10:00:00Z');

      expect(result.getTime()).toBe(expected.getTime());
    });
  });
});
