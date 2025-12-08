import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../services/oauth.service';
import type { GoogleProfile } from '../types/oauth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const publicUrl = configService.get<string>('PUBLIC_URL');
    const explicitCallbackUrl = configService.get<string>(
      'GOOGLE_CALLBACK_URL',
    );

    const callbackURL =
      explicitCallbackUrl ||
      (publicUrl
        ? `${publicUrl}/api/v1/auth/google/callback`
        : 'http://localhost:3000/api/v1/auth/google/callback');

    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') ||
        'your-google-client-id',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
        'your-google-client-secret',
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });

    this.logger.log(`Google OAuth callback URL: ${callbackURL}`);
  }

  async validate(
    req: { query?: { state?: string } },
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const result = await this.oauthService.validateGoogleUser(profile);

      if (req?.query?.state) {
        const resultWithState = result as unknown as Record<string, unknown>;
        resultWithState.state = req.query.state;
      }

      done(null, result);
    } catch (error) {
      done(error as Error, false);
    }
  }
}
