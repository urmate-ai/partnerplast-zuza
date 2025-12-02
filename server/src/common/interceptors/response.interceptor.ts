import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiSuccessResponse } from '../types/api-response.types';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data: T) => {
        if (data instanceof StreamableFile) {
          return data as unknown as ApiSuccessResponse<T>;
        }

        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          (data as unknown as ApiSuccessResponse<T>).success === true
        ) {
          return data as unknown as ApiSuccessResponse<T>;
        }

        return {
          success: true,
          data: data,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
