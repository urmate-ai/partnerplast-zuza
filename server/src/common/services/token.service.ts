import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { JwtPayload } from '../../auth/types/auth.types';

export interface TokenResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateTokenResult(user: User): TokenResult {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
