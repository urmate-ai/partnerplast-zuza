export type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
};

export const getApiErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isApiError(error)) {
    return error.response?.data?.message || error.message || defaultMessage;
  }
  
  return defaultMessage;
};

