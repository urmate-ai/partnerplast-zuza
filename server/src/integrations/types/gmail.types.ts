export type GmailOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GmailTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
};

export type GmailUserInfo = {
  email: string;
  name?: string;
};

export type GmailAuthUrlResponse = {
  authUrl: string;
  state: string;
};

export type GmailConnectionStatus = {
  isConnected: boolean;
  email?: string;
  connectedAt?: Date;
  scopes?: string[];
};

export type GmailMessage = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  date: Date;
  snippet: string;
  body?: string;
  isUnread: boolean;
};

export type GmailThread = {
  id: string;
  messages: GmailMessage[];
  snippet: string;
  subject: string;
};

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
] as const;

export type GmailScope = (typeof GMAIL_SCOPES)[number];
