import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { TokenEncryptionService } from './token-encryption.service';
import { OAuthStateService } from './oauth-state.service';
import type {
  GoogleOAuthConfig,
  GoogleTokens,
  UserIntegrationData,
  AuthenticatedClientResult,
} from '../../types/google-oauth.types';
import type { Prisma } from '@prisma/client';
@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly config: GoogleOAuthConfig;
  private readonly oauth2Client: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenEncryption: TokenEncryptionService,
    private readonly stateService: OAuthStateService,
  ) {
    this.config = this.buildConfig();
    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
    );
  }

  generateAuthUrl(
    userId: string,
    scopes: readonly string[],
    redirectPath: string,
    expoRedirectUri?: string,
  ): { authUrl: string; state: string; expoRedirectUrl?: string } {
    const redirectUri = expoRedirectUri || this.buildRedirectUri(redirectPath);
    const state = this.stateService.generate(userId, redirectUri);

    const tempClient = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      redirectUri,
    );

    const authUrl = tempClient.generateAuthUrl({
      access_type: 'offline',
      scope: [...scopes],
      state,
      prompt: 'consent',
    });

    this.logger.log(`Generated auth URL for user ${userId}`);
    this.logger.debug(`Full auth URL: ${authUrl}`);

    return {
      authUrl,
      state,
      ...(expoRedirectUri && { expoRedirectUrl: expoRedirectUri }),
    };
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ userId: string; tokens: GoogleTokens }> {
    const { userId, redirectUri } = this.stateService.validateAndConsume(state);

    try {
      const client = redirectUri
        ? new google.auth.OAuth2(
            this.config.clientId,
            this.config.clientSecret,
            redirectUri,
          )
        : this.oauth2Client;

      const { tokens } = await client.getToken(code);

      if (!tokens.access_token) {
        throw new BadRequestException('No access token received from Google');
      }

      return {
        userId,
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expiry_date: tokens.expiry_date ?? null,
          scope: tokens.scope ?? null,
        },
      };
    } catch (error) {
      this.logger.error('Failed to handle OAuth callback:', error);
      throw new BadRequestException('Failed to exchange authorization code');
    }
  }

  async getAuthenticatedClient(
    userId: string,
    integrationName: string,
  ): Promise<AuthenticatedClientResult> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: integrationName },
    });

    if (!integration) {
      throw new NotFoundException(`${integrationName} integration not found`);
    }

    const userIntegration = await this.prisma.userIntegration.findUnique({
      where: {
        userId_integrationId: {
          userId,
          integrationId: integration.id,
        },
      },
    });

    if (!userIntegration || !userIntegration.isConnected) {
      throw new UnauthorizedException(`${integrationName} not connected`);
    }

    if (!userIntegration.accessToken) {
      throw new UnauthorizedException('No access token available');
    }

    const accessToken = this.tokenEncryption.decrypt(
      userIntegration.accessToken,
    );
    const refreshToken = userIntegration.refreshToken
      ? this.tokenEncryption.decrypt(userIntegration.refreshToken)
      : undefined;

    const client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
    );

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: userIntegration.tokenExpiresAt?.getTime(),
    });

    if (
      userIntegration.tokenExpiresAt &&
      userIntegration.tokenExpiresAt < new Date()
    ) {
      await this.refreshToken(userId, integration.id, client);
    }

    return { client, integrationId: integration.id };
  }

  async disconnect(userId: string, integrationName: string): Promise<void> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: integrationName },
    });

    if (!integration) {
      throw new NotFoundException(`${integrationName} integration not found`);
    }

    const userIntegration = await this.prisma.userIntegration.findUnique({
      where: {
        userId_integrationId: {
          userId,
          integrationId: integration.id,
        },
      },
    });

    if (!userIntegration) {
      throw new NotFoundException(`${integrationName} connection not found`);
    }

    if (userIntegration.accessToken) {
      try {
        const decryptedToken = this.tokenEncryption.decrypt(
          userIntegration.accessToken,
        );
        await this.oauth2Client.revokeToken(decryptedToken);
      } catch (error) {
        this.logger.warn('Failed to revoke Google token:', error);
      }
    }

    await this.prisma.userIntegration.delete({
      where: {
        userId_integrationId: {
          userId,
          integrationId: integration.id,
        },
      },
    });

    this.logger.log(`${integrationName} disconnected for user ${userId}`);
  }

  async saveUserIntegration(data: UserIntegrationData): Promise<void> {
    await this.prisma.userIntegration.upsert({
      where: {
        userId_integrationId: {
          userId: data.userId,
          integrationId: data.integrationId,
        },
      },
      create: {
        userId: data.userId,
        integrationId: data.integrationId,
        isConnected: true,
        accessToken: this.tokenEncryption.encrypt(data.accessToken),
        refreshToken: data.refreshToken
          ? this.tokenEncryption.encrypt(data.refreshToken)
          : null,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
      update: {
        isConnected: true,
        accessToken: this.tokenEncryption.encrypt(data.accessToken),
        refreshToken: data.refreshToken
          ? this.tokenEncryption.encrypt(data.refreshToken)
          : null,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  }

  private async refreshToken(
    userId: string,
    integrationId: string,
    client: OAuth2Client,
  ): Promise<void> {
    try {
      const { credentials } = await client.refreshAccessToken();

      if (credentials.access_token) {
        await this.prisma.userIntegration.update({
          where: {
            userId_integrationId: {
              userId,
              integrationId,
            },
          },
          data: {
            accessToken: this.tokenEncryption.encrypt(credentials.access_token),
            tokenExpiresAt: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : undefined,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  private buildConfig(): GoogleOAuthConfig {
    return {
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret:
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      redirectUri: '',
    };
  }

  private buildRedirectUri(path: string): string {
    const explicitRedirectUri = this.configService.get<string>(
      path.includes('calendar')
        ? 'CALENDAR_REDIRECT_URI'
        : 'GMAIL_REDIRECT_URI',
    );
    const publicUrl = this.configService.get<string>('PUBLIC_URL');

    if (explicitRedirectUri) {
      this.logger.debug(`Using explicit redirect URI: ${explicitRedirectUri}`);
      return explicitRedirectUri;
    }
    if (publicUrl) {
      const fullUri = `${publicUrl}${path}`;
      this.logger.debug(`Using PUBLIC_URL to build redirect URI: ${fullUri}`);
      return fullUri;
    }

    const fallbackUri = `https://partnerplast-zuza.onrender.com${path}`;
    this.logger.warn(
      `No PUBLIC_URL or explicit redirect URI set! Using fallback: ${fallbackUri}. ` +
        `Please set PUBLIC_URL environment variable for production.`,
    );
    return fallbackUri;
  }
}
