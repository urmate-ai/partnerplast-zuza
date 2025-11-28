import { getErrorMessage } from '../error.utils';

describe('error.utils', () => {
  describe('getErrorMessage', () => {
    it('should return error message for Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return string for string error', () => {
      const error = 'String error message';
      expect(getErrorMessage(error)).toBe('String error message');
    });

    it('should return default message for unknown error type', () => {
      const error = { code: 500, status: 'error' };
      expect(getErrorMessage(error)).toBe('Wystąpił nieoczekiwany błąd');
    });

    it('should return default message for null', () => {
      expect(getErrorMessage(null)).toBe('Wystąpił nieoczekiwany błąd');
    });

    it('should return default message for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('Wystąpił nieoczekiwany błąd');
    });

    it('should return default message for number', () => {
      expect(getErrorMessage(404)).toBe('Wystąpił nieoczekiwany błąd');
    });

    it('should return default message for boolean', () => {
      expect(getErrorMessage(true)).toBe('Wystąpił nieoczekiwany błąd');
    });
  });
});

