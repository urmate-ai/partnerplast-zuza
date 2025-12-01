import type { OAuth2Client } from 'google-auth-library';

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleTokens = {
  access_token: string;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string | null;
};

export type IntegrationMetadata = {
  email?: string;
  timezone?: string;
  [key: string]: unknown;
};

export type UserIntegrationData = {
  userId: string;
  integrationId: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date;
  scopes: string[];
  metadata: IntegrationMetadata;
};

export type AuthenticatedClientResult = {
  client: OAuth2Client;
  integrationId: string;
};
