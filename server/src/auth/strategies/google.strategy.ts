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

    if (!global.oauthStates) {
      global.oauthStates = new Map();
    }

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
    this.logger.debug(
      `[GoogleStrategy] PUBLIC_URL: ${publicUrl}, explicitCallbackUrl: ${explicitCallbackUrl}`,
    );
  }

  async validate(
    req: {
      query?: { state?: string };
      session?: { oauthRedirectUri?: string };
    },
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const result = await this.oauthService.validateGoogleUser(profile);

      const passportState = req?.query?.state;
      const sessionRedirectUri = req?.session?.oauthRedirectUri;

      if (sessionRedirectUri) {
        const resultWithState = result as unknown as Record<string, unknown>;
        resultWithState.state = sessionRedirectUri;
        this.logger.log(
          `[GoogleStrategy] Using redirect URI from session: ${sessionRedirectUri}`,
        );
      } else if (passportState && global.oauthStates) {
        const storedState = global.oauthStates.get(passportState);
        if (storedState && storedState.expiresAt > Date.now()) {
          const resultWithState = result as unknown as Record<string, unknown>;
          resultWithState.state = storedState.redirectUri;
          global.oauthStates.delete(passportState);
          this.logger.log(
            `[GoogleStrategy] Using redirect URI from global map: ${storedState.redirectUri}`,
          );
        }
      }

      done(null, result);
    } catch (error) {
      done(error as Error, false);
    }
  }
}
