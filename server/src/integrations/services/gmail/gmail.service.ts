import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleOAuthService } from '../oauth/google-oauth.service';
import { GoogleIntegrationService } from '../google/google-integration.service';
import { GmailMapper } from '../../utils/gmail.mapper';
import { GmailFormatter } from '../../utils/gmail-formatter.utils';
import type {
  GmailAuthUrlResponse,
  GmailConnectionStatus,
  GmailMessage,
} from '../../types/gmail.types';
import { GMAIL_SCOPES } from '../../types/gmail.types';
import type { UserIntegrationData } from '../../types/google-oauth.types';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly integrationName = 'Gmail';

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthService: GoogleOAuthService,
    private readonly integrationService: GoogleIntegrationService,
    private readonly configService: ConfigService,
  ) {}

  generateAuthUrl(
    userId: string,
    expoRedirectUri?: string,
  ): GmailAuthUrlResponse {
    return this.oauthService.generateAuthUrl(
      userId,
      GMAIL_SCOPES,
      '/api/v1/integrations/gmail/callback',
      expoRedirectUri,
    );
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ userId: string; redirectUri?: string }> {
    const { userId, tokens, redirectUri } =
      await this.oauthService.handleCallback(code, state);

    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );

      const client = new google.auth.OAuth2(clientId, clientSecret);
      client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? undefined,
        expiry_date: tokens.expiry_date ?? undefined,
        scope: tokens.scope ?? undefined,
      });

      const gmail = google.gmail({ version: 'v1', auth: client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      const { id: integrationId } =
        await this.integrationService.findOrCreateIntegration({
          name: this.integrationName,
          description: 'Integracja z Gmail - czytaj i wysyłaj emaile',
          icon: 'mail',
          category: 'communication',
        });

      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      const userIntegrationData: UserIntegrationData = {
        userId,
        integrationId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope?.split(' ').filter(Boolean) || [],
        metadata: {
          email: profile.data.emailAddress || userId,
        },
      };

      await this.oauthService.saveUserIntegration(userIntegrationData);

      this.logger.log(`Gmail connected successfully for user ${userId}`);
      return { userId, redirectUri };
    } catch (error) {
      this.logger.error('Failed to handle Gmail callback:', error);
      throw new BadRequestException('Failed to connect Gmail account');
    }
  }

  async disconnectGmail(userId: string): Promise<void> {
    await this.oauthService.disconnect(userId, this.integrationName);
  }

  async getConnectionStatus(userId: string): Promise<GmailConnectionStatus> {
    const status = await this.integrationService.getConnectionStatus(
      userId,
      this.integrationName,
    );

    return {
      isConnected: status.isConnected,
      email: status.email,
      connectedAt: status.connectedAt,
      scopes: status.scopes,
    };
  }

  async getRecentMessages(
    userId: string,
    maxResults = 10,
  ): Promise<GmailMessage[]> {
    const { client } = await this.oauthService.getAuthenticatedClient(
      userId,
      this.integrationName,
    );
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

        detailedMessages.push(GmailMapper.toMessageDto(detail.data));
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
    const { client } = await this.oauthService.getAuthenticatedClient(
      userId,
      this.integrationName,
    );
    const gmail = google.gmail({ version: 'v1', auth: client });

    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const fromEmail = profile.data.emailAddress;

      if (!fromEmail) {
        throw new BadRequestException('Unable to get sender email address');
      }

      this.logger.debug(
        `Sending email - To: ${to}, Subject: ${subject}, Body length: ${body?.length || 0}`,
      );

      const htmlBody = this.formatEmailBody(body);

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

      const encodedMessage = this.encodeMessage(message);

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
      return GmailFormatter.formatForAiContext(messages);
    } catch (error) {
      this.logger.error('Failed to get messages for AI context:', error);
      return 'Nie udało się pobrać wiadomości email.';
    }
  }

  private formatEmailBody(body: string): string {
    if (body.includes('<') && body.includes('>')) {
      return body;
    }

    return body
      .split('\n')
      .map((line) => `<p>${line || '<br>'}</p>`)
      .join('');
  }

  private encodeMessage(message: string): string {
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
