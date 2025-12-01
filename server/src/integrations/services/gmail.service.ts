import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type {
  GmailOAuthConfig,
  GmailAuthUrlResponse,
  GmailConnectionStatus,
  GmailMessage,
} from '../types/gmail.types';
import { GMAIL_SCOPES } from '../types/gmail.types';
import * as crypto from 'crypto';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly oauth2Client: OAuth2Client;
  private readonly config: GmailOAuthConfig;
  private readonly stateStore = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const explicitRedirectUri =
      this.configService.get<string>('GMAIL_REDIRECT_URI');
    const publicUrl = this.configService.get<string>('PUBLIC_URL');

    let redirectUri: string;
    if (explicitRedirectUri) {
      redirectUri = explicitRedirectUri;
    } else if (publicUrl) {
      redirectUri = `${publicUrl}/api/v1/integrations/gmail/callback`;
    } else {
      redirectUri = 'http://localhost:3000/api/v1/integrations/gmail/callback';
    }

    this.config = {
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret:
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      redirectUri,
    };

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri,
    );
    this.logger.debug(
      `Gmail OAuth configured with redirect URI: ${this.config.redirectUri}`,
    );
    setInterval(() => this.cleanupExpiredStates(), 10 * 60 * 1000);
  }

  generateAuthUrl(userId: string): GmailAuthUrlResponse {
    const state = this.generateState();

    this.stateStore.set(state, {
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [...GMAIL_SCOPES],
      state,
      prompt: 'consent',
    });

    this.logger.log(`Generated auth URL for user ${userId}`);
    this.logger.debug(`Full auth URL: ${authUrl}`);
    return { authUrl, state };
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ userId: string }> {
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      throw new BadRequestException('Invalid or expired state parameter');
    }

    if (Date.now() > stateData.expiresAt) {
      this.stateStore.delete(state);
      throw new BadRequestException('State parameter has expired');
    }

    const userId = stateData.userId;
    this.stateStore.delete(state);

    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new BadRequestException('No access token received from Google');
      }

      this.oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      let integration = await this.prisma.integration.findFirst({
        where: { name: 'Gmail' },
      });

      if (!integration) {
        integration = await this.prisma.integration.create({
          data: {
            name: 'Gmail',
            description: 'Integracja z Gmail - czytaj i wysyłaj emaile',
            icon: 'mail',
            category: 'communication',
            isActive: true,
          },
        });
      }

      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await this.prisma.userIntegration.upsert({
        where: {
          userId_integrationId: {
            userId,
            integrationId: integration.id,
          },
        },
        create: {
          userId,
          integrationId: integration.id,
          isConnected: true,
          accessToken: this.encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token
            ? this.encryptToken(tokens.refresh_token)
            : null,
          tokenExpiresAt: expiresAt,
          scopes: tokens.scope?.split(' ') || [],
          metadata: {
            email: profile.data.emailAddress,
          },
        },
        update: {
          isConnected: true,
          accessToken: this.encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token
            ? this.encryptToken(tokens.refresh_token)
            : null,
          tokenExpiresAt: expiresAt,
          scopes: tokens.scope?.split(' ') || [],
          metadata: {
            email: profile.data.emailAddress,
          },
        },
      });

      this.logger.log(`Gmail connected successfully for user ${userId}`);
      return { userId };
    } catch (error) {
      this.logger.error('Failed to handle Gmail callback:', error);
      throw new BadRequestException('Failed to connect Gmail account');
    }
  }

  async disconnectGmail(userId: string): Promise<void> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: 'Gmail' },
    });

    if (!integration) {
      throw new NotFoundException('Gmail integration not found');
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
      throw new NotFoundException('Gmail connection not found');
    }

    if (userIntegration?.accessToken) {
      try {
        const decryptedToken = this.decryptToken(userIntegration.accessToken);
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

    this.logger.log(`Gmail disconnected for user ${userId}`);
  }

  async getConnectionStatus(userId: string): Promise<GmailConnectionStatus> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: 'Gmail' },
    });

    if (!integration) {
      return { isConnected: false };
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
      return { isConnected: false };
    }

    return {
      isConnected: true,
      email: (userIntegration.metadata as { email?: string })?.email,
      connectedAt: userIntegration.createdAt,
      scopes: userIntegration.scopes,
    };
  }

  async getRecentMessages(
    userId: string,
    maxResults = 10,
  ): Promise<GmailMessage[]> {
    const client = await this.getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox',
      });

      const messages = response.data.messages || [];
      const detailedMessages: GmailMessage[] = [];

      for (const message of messages) {
        if (!message.id) continue;

        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        });

        const headers = detail.data.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value || '';

        detailedMessages.push({
          id: detail.data.id || '',
          threadId: detail.data.threadId || '',
          subject: getHeader('subject'),
          from: getHeader('from'),
          to: getHeader('to')
            .split(',')
            .map((e) => e.trim()),
          date: new Date(parseInt(detail.data.internalDate || '0')),
          snippet: detail.data.snippet || '',
          isUnread: detail.data.labelIds?.includes('UNREAD') || false,
        });
      }

      return detailedMessages;
    } catch (error) {
      this.logger.error('Failed to fetch Gmail messages:', error);
      throw new BadRequestException('Failed to fetch messages');
    }
  }

  async sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string,
    cc?: string[],
    bcc?: string[],
  ): Promise<{ messageId: string; success: boolean }> {
    const client = await this.getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth: client });

    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const fromEmail = profile.data.emailAddress;

      this.logger.debug(
        `Sending email - To: ${to}, Subject: ${subject}, Body length: ${body?.length || 0}`,
      );

      const htmlBody =
        body.includes('<') && body.includes('>')
          ? body
          : body
              .split('\n')
              .map((line) => `<p>${line || '<br>'}</p>`)
              .join('');

      const messageParts = [
        `From: ${fromEmail}`,
        `To: ${to}`,
        cc && cc.length > 0 ? `Cc: ${cc.join(', ')}` : '',
        bcc && bcc.length > 0 ? `Bcc: ${bcc.join(', ')}` : '',
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlBody,
      ].filter((part) => part !== '');

      const message = messageParts.join('\r\n');
      this.logger.debug(
        `Email message length: ${message.length}, Body in message: ${message.includes(htmlBody)}`,
      );

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      this.logger.log(
        `Email sent successfully for user ${userId}, messageId: ${response.data.id}`,
      );

      return {
        messageId: response.data.id || '',
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw new BadRequestException('Failed to send email');
    }
  }

  async getMessagesForAiContext(
    userId: string,
    maxResults = 20,
  ): Promise<string> {
    try {
      const messages = await this.getRecentMessages(userId, maxResults);

      if (messages.length === 0) {
        return 'Brak wiadomości email w skrzynce odbiorczej.';
      }

      const formattedMessages = messages.map((msg, index) => {
        const dateStr = new Date(msg.date).toLocaleString('pl-PL');
        const unreadFlag = msg.isUnread ? '[NIEPRZECZYTANA] ' : '';
        return `${index + 1}. ${unreadFlag}Od: ${msg.from}
   Temat: ${msg.subject}
   Data: ${dateStr}
   Podgląd: ${msg.snippet}`;
      });

      return `Ostatnie wiadomości email użytkownika (${messages.length}):\n\n${formattedMessages.join('\n\n')}`;
    } catch (error) {
      this.logger.error('Failed to get messages for AI context:', error);
      return 'Nie udało się pobrać wiadomości email.';
    }
  }

  private async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: 'Gmail' },
    });

    if (!integration) {
      throw new NotFoundException('Gmail integration not found');
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
      throw new UnauthorizedException('Gmail not connected');
    }

    if (!userIntegration.accessToken) {
      throw new UnauthorizedException('No access token available');
    }

    const accessToken = this.decryptToken(userIntegration.accessToken);
    const refreshToken = userIntegration.refreshToken
      ? this.decryptToken(userIntegration.refreshToken)
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
      try {
        const { credentials } = await client.refreshAccessToken();

        if (credentials.access_token) {
          await this.prisma.userIntegration.update({
            where: {
              userId_integrationId: {
                userId,
                integrationId: integration.id,
              },
            },
            data: {
              accessToken: this.encryptToken(credentials.access_token),
              tokenExpiresAt: credentials.expiry_date
                ? new Date(credentials.expiry_date)
                : undefined,
            },
          });
        }
      } catch (error) {
        this.logger.error('Failed to refresh Gmail token:', error);
        throw new UnauthorizedException('Failed to refresh access token');
      }
    }

    return client;
  }

  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private encryptToken(token: string): string {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptToken(encryptedToken: string): string {
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }

    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, data] of this.stateStore.entries()) {
      if (now > data.expiresAt) {
        this.stateStore.delete(state);
      }
    }
  }
}
