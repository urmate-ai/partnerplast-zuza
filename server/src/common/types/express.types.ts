import { Request, Response } from 'express';
import { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { GoogleAuthResult } from '../../auth/types/oauth.types';

export interface AuthenticatedRequest extends Request {
  user: CurrentUserPayload;
}

export interface GoogleCallbackRequest extends Request {
  user: GoogleAuthResult;
}

export type ExpressResponse = Response;
