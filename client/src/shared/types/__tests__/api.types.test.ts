import { isApiError, getApiErrorMessage } from '../api.types';
import type { ApiError } from '../api.types';

describe('api.types', () => {
  describe('isApiError', () => {
    it('should return true for object with response property', () => {
      const error: ApiError = {
        response: {
          data: {
            message: 'Error message',
          },
        },
      };
      expect(isApiError(error)).toBe(true);
    });

    it('should return true for object with message property', () => {
      const error: ApiError = {
        message: 'Error message',
      };
      expect(isApiError(error)).toBe(true);
    });

    it('should return true for object with both response and message', () => {
      const error: ApiError = {
        response: {
          data: {
            message: 'Response error',
          },
        },
        message: 'Error message',
      };
      expect(isApiError(error)).toBe(true);
    });

    it('should return false for Error instance', () => {
      const error = new Error('Test error');
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isApiError('error string')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it('should return false for number', () => {
      expect(isApiError(404)).toBe(false);
    });
  });

  describe('getApiErrorMessage', () => {
    it('should return error message for Error instance', () => {
      const error = new Error('Test error message');
      expect(getApiErrorMessage(error, 'Default message')).toBe('Test error message');
    });

    it('should return response data message for ApiError with response', () => {
      const error: ApiError = {
        response: {
          data: {
            message: 'Response error message',
          },
        },
      };
      expect(getApiErrorMessage(error, 'Default message')).toBe('Response error message');
    });

    it('should return message property for ApiError with message', () => {
      const error: ApiError = {
        message: 'Error message',
      };
      expect(getApiErrorMessage(error, 'Default message')).toBe('Error message');
    });

    it('should prefer response data message over message property', () => {
      const error: ApiError = {
        response: {
          data: {
            message: 'Response error',
          },
        },
        message: 'Error message',
      };
      expect(getApiErrorMessage(error, 'Default message')).toBe('Response error');
    });

    it('should return default message if ApiError has no message', () => {
      const error: ApiError = {
        response: {},
      };
      expect(getApiErrorMessage(error, 'Default message')).toBe('Default message');
    });

    it('should return default message for unknown error type', () => {
      const error = { code: 500 };
      expect(getApiErrorMessage(error, 'Default message')).toBe('Default message');
    });

    it('should return default message for null', () => {
      expect(getApiErrorMessage(null, 'Default message')).toBe('Default message');
    });
  });
});

