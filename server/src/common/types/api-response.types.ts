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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T = unknown>
  extends ApiSuccessResponse<T[]> {
  meta: {
    pagination: PaginationMeta;
    timestamp: string;
  };
}
