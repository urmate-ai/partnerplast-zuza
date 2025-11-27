import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../services/oauth.service';
import type { GoogleProfile } from '../types/oauth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'your-google-client-id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'your-google-client-secret',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const result = await this.oauthService.validateGoogleUser(profile);
      done(null, result);
    } catch (error) {
      done(error as Error, false);
    }
  }
}

