export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    statusCode: number;
  };
  meta: {
    timestamp: string;
    path: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiError = {
  response?: {
    data?: ApiErrorResponse;
    status?: number;
  };
  message?: string;
};

export const isApiError = (error: unknown): error is ApiError => {
  if (error instanceof Error) {
    return false;
  }
  
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
    if (error.response?.data?.success === false) {
      return error.response.data.error.message || defaultMessage;
    }
    
    const responseData = error.response?.data as { message?: string };
    if (responseData?.message) {
      return responseData.message;
    }
    
    return error.message || defaultMessage;
  }
  
  return defaultMessage;
};

export const getApiErrorCode = (error: unknown): string | undefined => {
  if (isApiError(error) && error.response?.data?.success === false) {
    return error.response.data.error.code;
  }
  return undefined;
};

export const getApiErrorDetails = (error: unknown): unknown => {
  if (isApiError(error) && error.response?.data?.success === false) {
    return error.response.data.error.details;
  }
  return undefined;
};


