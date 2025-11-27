import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import type { GoogleProfile, GoogleAuthResult } from '../types/oauth.types';
import type { JwtPayload } from '../types/auth.types';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<GoogleAuthResult> {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new Error('Email not found in Google profile');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.displayName,
          provider: 'google',
          providerId: profile.id,
        },
      });
      this.logger.log(`New Google user created: ${email}`);
    } else if (user.provider !== 'google') {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'google',
          providerId: profile.id,
        },
      });
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User): GoogleAuthResult {
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

