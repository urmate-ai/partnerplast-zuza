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

const getHttpErrorMessage = (statusCode?: number): string | null => {
  if (!statusCode) return null;
  
  const errorMessages: Record<number, string> = {
    400: 'Nieprawidłowe żądanie',
    401: 'Nieprawidłowy email lub hasło',
    403: 'Brak uprawnień do wykonania tej operacji',
    404: 'Nie znaleziono zasobu',
    409: 'Użytkownik z tym emailem już istnieje',
    422: 'Nieprawidłowe dane wejściowe',
    429: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę',
    500: 'Błąd serwera. Spróbuj ponownie później',
    502: 'Błąd połączenia z serwerem',
    503: 'Serwis tymczasowo niedostępny',
  };
  
  return errorMessages[statusCode] || null;
};

export const getApiErrorMessage = (
  error: unknown,
  defaultMessage: string = 'Wystąpił nieoczekiwany błąd',
): string => {
  // Sprawdź, czy to błąd axios
  if (isApiError(error)) {
    const statusCode = error.response?.status;
    
    // Najpierw spróbuj wyciągnąć komunikat z odpowiedzi API
    if (error.response?.data) {
      // Format ApiErrorResponse (success: false)
      if (error.response.data.success === false && error.response.data.error) {
        const apiMessage = error.response.data.error.message;
        if (apiMessage && !apiMessage.includes('Request Failed')) {
          return apiMessage;
        }
      }
      
      // Format z polem message bezpośrednio
      const responseData = error.response.data as { message?: string; error?: { message?: string } };
      if (responseData?.message && !responseData.message.includes('Request Failed')) {
        return responseData.message;
      }
      if (responseData?.error?.message && !responseData.error.message.includes('Request Failed')) {
        return responseData.error.message;
      }
    }
    
    // Jeśli nie ma komunikatu z API, użyj mapowania kodów HTTP
    const httpMessage = getHttpErrorMessage(statusCode);
    if (httpMessage) {
      return httpMessage;
    }
    
    // Fallback do komunikatu z axios (jeśli nie zawiera "Request Failed")
    if (error.message && !error.message.includes('Request Failed')) {
      return error.message;
    }
  }
  
  // Dla zwykłych błędów Error
  if (error instanceof Error) {
    // Sprawdź, czy komunikat zawiera kod statusu
    const statusMatch = error.message.match(/status code (\d+)/);
    if (statusMatch) {
      const statusCode = parseInt(statusMatch[1], 10);
      const httpMessage = getHttpErrorMessage(statusCode);
      if (httpMessage) {
        return httpMessage;
      }
    }
    
    // Jeśli komunikat nie zawiera "Request Failed", zwróć go
    if (!error.message.includes('Request Failed')) {
      return error.message;
    }
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


