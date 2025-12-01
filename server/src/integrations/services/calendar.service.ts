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
  CalendarOAuthConfig,
  CalendarAuthUrlResponse,
  CalendarConnectionStatus,
  CalendarEvent,
  CalendarList,
} from '../types/calendar.types';
import { CALENDAR_SCOPES } from '../types/calendar.types';
import * as crypto from 'crypto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly oauth2Client: OAuth2Client;
  private readonly config: CalendarOAuthConfig;
  private readonly stateStore = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const explicitRedirectUri = this.configService.get<string>(
      'CALENDAR_REDIRECT_URI',
    );
    const publicUrl = this.configService.get<string>('PUBLIC_URL');

    let redirectUri: string;
    if (explicitRedirectUri) {
      redirectUri = explicitRedirectUri;
    } else if (publicUrl) {
      redirectUri = `${publicUrl}/api/v1/integrations/calendar/callback`;
    } else {
      redirectUri =
        'http://localhost:3000/api/v1/integrations/calendar/callback';
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
      `Calendar OAuth configured with redirect URI: ${this.config.redirectUri}`,
    );
    setInterval(() => this.cleanupExpiredStates(), 10 * 60 * 1000);
  }

  generateAuthUrl(userId: string): CalendarAuthUrlResponse {
    const state = this.generateState();

    this.stateStore.set(state, {
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [...CALENDAR_SCOPES],
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
      const calendar = google.calendar({
        version: 'v3',
        auth: this.oauth2Client,
      });

      const calendarList = await calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find(
        (cal) => cal.primary,
      );

      let timezone: string | null | undefined;
      try {
        const settings = await calendar.settings.list();
        const timezoneSetting = settings.data.items?.find(
          (s) => s.id === 'timezone',
        );
        timezone = timezoneSetting?.value;
      } catch (error) {
        this.logger.warn('Failed to fetch timezone setting:', error);
      }

      let integration = await this.prisma.integration.findFirst({
        where: { name: 'Google Calendar' },
      });

      if (!integration) {
        integration = await this.prisma.integration.create({
          data: {
            name: 'Google Calendar',
            description:
              'Integracja z Google Calendar - zarządzaj wydarzeniami',
            icon: 'calendar',
            category: 'productivity',
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
            email: primaryCalendar?.id || userId,
            timezone: timezone || undefined,
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
            email: primaryCalendar?.id || userId,
            timezone: timezone || undefined,
          },
        },
      });

      this.logger.log(`Calendar connected successfully for user ${userId}`);
      return { userId };
    } catch (error) {
      this.logger.error('Failed to handle Calendar callback:', error);
      throw new BadRequestException('Failed to connect Calendar account');
    }
  }

  async disconnectCalendar(userId: string): Promise<void> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: 'Google Calendar' },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
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
      throw new NotFoundException('Calendar connection not found');
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

    this.logger.log(`Calendar disconnected for user ${userId}`);
  }

  async getConnectionStatus(userId: string): Promise<CalendarConnectionStatus> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: 'Google Calendar' },
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

    const metadata = userIntegration.metadata as {
      email?: string;
      timezone?: string;
    };

    return {
      isConnected: true,
      email: metadata?.email,
      connectedAt: userIntegration.createdAt,
      scopes: userIntegration.scopes,
      timezone: metadata?.timezone,
    };
  }

  async getCalendars(userId: string): Promise<CalendarList[]> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    try {
      const response = await calendar.calendarList.list();

      return (
        response.data.items?.map((cal) => ({
          id: cal.id || '',
          summary: cal.summary || 'Untitled Calendar',
          description: cal.description || undefined,
          primary: cal.primary || false,
          accessRole: cal.accessRole || undefined,
          backgroundColor: cal.backgroundColor || undefined,
          foregroundColor: cal.foregroundColor || undefined,
        })) || []
      );
    } catch (error) {
      this.logger.error('Failed to fetch calendars:', error);
      throw new BadRequestException('Failed to fetch calendars');
    }
  }

  async getEvents(
    userId: string,
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 50,
  ): Promise<CalendarEvent[]> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return (
        response.data.items?.map((event) => ({
          id: event.id || '',
          summary: event.summary || 'No Title',
          description: event.description || undefined,
          location: event.location || undefined,
          start: {
            dateTime: event.start?.dateTime || undefined,
            date: event.start?.date || undefined,
            timeZone: event.start?.timeZone || undefined,
          },
          end: {
            dateTime: event.end?.dateTime || undefined,
            date: event.end?.date || undefined,
            timeZone: event.end?.timeZone || undefined,
          },
          attendees:
            event.attendees?.map((att) => ({
              email: att.email || '',
              displayName: att.displayName || undefined,
              responseStatus:
                (att.responseStatus as
                  | 'needsAction'
                  | 'declined'
                  | 'tentative'
                  | 'accepted') || undefined,
            })) || undefined,
          organizer: event.organizer
            ? {
                email: event.organizer.email || '',
                displayName: event.organizer.displayName || undefined,
              }
            : undefined,
          status:
            (event.status as 'confirmed' | 'tentative' | 'cancelled') ||
            'confirmed',
          htmlLink: event.htmlLink || undefined,
          recurringEventId: event.recurringEventId || undefined,
          isAllDay: !event.start?.dateTime && !!event.start?.date,
        })) || []
      );
    } catch (error) {
      this.logger.error('Failed to fetch events:', error);
      throw new BadRequestException('Failed to fetch events');
    }
  }

  async createEvent(
    userId: string,
    calendarId: string,
    eventData: {
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime?: string; date?: string; timeZone?: string };
      end: { dateTime?: string; date?: string; timeZone?: string };
      attendees?: Array<{ email: string }>;
    },
  ): Promise<CalendarEvent> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: eventData.summary,
          description: eventData.description,
          location: eventData.location,
          start: eventData.start,
          end: eventData.end,
          attendees: eventData.attendees?.map((att) => ({
            email: att.email,
          })),
        },
      });

      const event = response.data;
      return {
        id: event.id || '',
        summary: event.summary || 'No Title',
        description: event.description || undefined,
        location: event.location || undefined,
        start: {
          dateTime: event.start?.dateTime || undefined,
          date: event.start?.date || undefined,
          timeZone: event.start?.timeZone || undefined,
        },
        end: {
          dateTime: event.end?.dateTime || undefined,
          date: event.end?.date || undefined,
          timeZone: event.end?.timeZone || undefined,
        },
        attendees:
          event.attendees?.map((att) => ({
            email: att.email || '',
            displayName: att.displayName || undefined,
            responseStatus:
              (att.responseStatus as
                | 'needsAction'
                | 'declined'
                | 'tentative'
                | 'accepted') || undefined,
          })) || undefined,
        organizer: event.organizer
          ? {
              email: event.organizer.email || '',
              displayName: event.organizer.displayName || undefined,
            }
          : undefined,
        status:
          (event.status as 'confirmed' | 'tentative' | 'cancelled') ||
          'confirmed',
        htmlLink: event.htmlLink || undefined,
        isAllDay: !event.start?.dateTime && !!event.start?.date,
      };
    } catch (error) {
      this.logger.error('Failed to create event:', error);
      throw new BadRequestException('Failed to create event');
    }
  }

  async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    eventData: {
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime?: string; date?: string; timeZone?: string };
      end?: { dateTime?: string; date?: string; timeZone?: string };
      attendees?: Array<{ email: string }>;
    },
  ): Promise<CalendarEvent> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    try {
      const existingEvent = await calendar.events.get({
        calendarId,
        eventId,
      });

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: {
          ...existingEvent.data,
          summary: eventData.summary ?? existingEvent.data.summary,
          description: eventData.description ?? existingEvent.data.description,
          location: eventData.location ?? existingEvent.data.location,
          start: eventData.start ?? existingEvent.data.start,
          end: eventData.end ?? existingEvent.data.end,
          attendees: eventData.attendees
            ? eventData.attendees.map((att) => ({ email: att.email }))
            : existingEvent.data.attendees,
        },
      });

      const event = response.data;
      return {
        id: event.id || '',
        summary: event.summary || 'No Title',
        description: event.description || undefined,
        location: event.location || undefined,
        start: {
          dateTime: event.start?.dateTime || undefined,
          date: event.start?.date || undefined,
          timeZone: event.start?.timeZone || undefined,
        },
        end: {
          dateTime: event.end?.dateTime || undefined,
          date: event.end?.date || undefined,
          timeZone: event.end?.timeZone || undefined,
        },
        attendees:
          event.attendees?.map((att) => ({
            email: att.email || '',
            displayName: att.displayName || undefined,
            responseStatus:
              (att.responseStatus as
                | 'needsAction'
                | 'declined'
                | 'tentative'
                | 'accepted') || undefined,
          })) || undefined,
        organizer: event.organizer
          ? {
              email: event.organizer.email || '',
              displayName: event.organizer.displayName || undefined,
            }
          : undefined,
        status:
          (event.status as 'confirmed' | 'tentative' | 'cancelled') ||
          'confirmed',
        htmlLink: event.htmlLink || undefined,
        isAllDay: !event.start?.dateTime && !!event.start?.date,
      };
    } catch (error) {
      this.logger.error('Failed to update event:', error);
      throw new BadRequestException('Failed to update event');
    }
  }

  async deleteEvent(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    const client = await this.getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });

    try {
      await calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      this.logger.error('Failed to delete event:', error);
      throw new BadRequestException('Failed to delete event');
    }
  }

  private async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
    const integration = await this.prisma.integration.findFirst({
      where: { name: 'Google Calendar' },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
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
      throw new UnauthorizedException('Calendar not connected');
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
        this.logger.error('Failed to refresh Calendar token:', error);
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

  async getEventsForAiContext(userId: string, daysAhead = 7): Promise<string> {
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(
        now.getTime() + daysAhead * 24 * 60 * 60 * 1000,
      ).toISOString();

      const events = await this.getEvents(
        userId,
        'primary',
        timeMin,
        timeMax,
        20,
      );

      if (events.length === 0) {
        return `Brak wydarzeń w kalendarzu w najbliższych ${daysAhead} dniach.`;
      }

      const formattedEvents = events.map((event, index) => {
        const startDate = event.start.dateTime
          ? new Date(event.start.dateTime)
          : event.start.date
            ? new Date(event.start.date)
            : null;

        const endDate = event.end.dateTime
          ? new Date(event.end.dateTime)
          : event.end.date
            ? new Date(event.end.date)
            : null;

        const dateStr = startDate
          ? startDate.toLocaleString('pl-PL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour:
                startDate.getHours() !== 0 || startDate.getMinutes() !== 0
                  ? '2-digit'
                  : undefined,
              minute: startDate.getMinutes() !== 0 ? '2-digit' : undefined,
            })
          : 'Data nieznana';

        const timeStr =
          startDate && !event.isAllDay
            ? `${startDate.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${endDate?.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : event.isAllDay
              ? 'Cały dzień'
              : '';

        return `${index + 1}. ${event.summary}
   Data: ${dateStr}${timeStr ? `\n   Godzina: ${timeStr}` : ''}${event.location ? `\n   Miejsce: ${event.location}` : ''}${event.description ? `\n   Opis: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}` : ''}`;
      });

      return `Nadchodzące wydarzenia w kalendarzu (${events.length}):\n\n${formattedEvents.join('\n\n')}`;
    } catch (error) {
      this.logger.error('Failed to get events for AI context:', error);
      return 'Nie udało się pobrać wydarzeń z kalendarza.';
    }
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
