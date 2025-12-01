import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleOAuthService } from '../oauth/google-oauth.service';
import { GoogleIntegrationService } from '../google/google-integration.service';
import { CalendarMapper } from '../../utils/calendar.mapper';
import { CalendarFormatter } from '../../utils/calendar-formatter.utils';
import type {
  CalendarAuthUrlResponse,
  CalendarConnectionStatus,
  CalendarEvent,
  CalendarList,
} from '../../types/calendar.types';
import { CALENDAR_SCOPES } from '../../types/calendar.types';
import type { UserIntegrationData } from '../../types/google-oauth.types';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly integrationName = 'Google Calendar';

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthService: GoogleOAuthService,
    private readonly integrationService: GoogleIntegrationService,
  ) {}

  generateAuthUrl(userId: string): CalendarAuthUrlResponse {
    return this.oauthService.generateAuthUrl(
      userId,
      CALENDAR_SCOPES,
      '/api/v1/integrations/calendar/callback',
    );
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ userId: string }> {
    const { userId, tokens } = await this.oauthService.handleCallback(
      code,
      state,
    );

    try {
      const client = new google.auth.OAuth2();
      client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? undefined,
        expiry_date: tokens.expiry_date ?? undefined,
        scope: tokens.scope ?? undefined,
      });
      const calendar = google.calendar({
        version: 'v3',
        auth: client,
      });

      const [calendarList, settings] = await Promise.all([
        calendar.calendarList.list(),
        calendar.settings.list().catch(() => ({
          data: {
            items: [] as Array<{ id?: string | null; value?: string | null }>,
          },
        })),
      ]);

      const primaryCalendar = calendarList.data.items?.find(
        (cal) => cal.primary,
      );

      const timezoneSetting = settings.data.items?.find(
        (s) => s.id === 'timezone',
      );
      const timezone = timezoneSetting?.value;

      const integrationResult =
        await this.integrationService.findOrCreateIntegration({
          name: this.integrationName,
          description: 'Integracja z Google Calendar - zarządzaj wydarzeniami',
          icon: 'calendar',
          category: 'productivity',
        });

      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      const userIntegrationData: UserIntegrationData = {
        userId,
        integrationId: integrationResult.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope?.split(' ').filter(Boolean) || [],
        metadata: {
          email: primaryCalendar?.id || userId,
          timezone: timezone || undefined,
        },
      };

      await this.oauthService.saveUserIntegration(userIntegrationData);

      this.logger.log(`Calendar connected successfully for user ${userId}`);
      return { userId };
    } catch (error) {
      this.logger.error('Failed to handle Calendar callback:', error);
      throw new BadRequestException('Failed to connect Calendar account');
    }
  }

  async disconnectCalendar(userId: string): Promise<void> {
    await this.oauthService.disconnect(userId, this.integrationName);
  }

  async getConnectionStatus(userId: string): Promise<CalendarConnectionStatus> {
    const status = await this.integrationService.getConnectionStatus(
      userId,
      this.integrationName,
    );

    return {
      isConnected: status.isConnected,
      email: status.email,
      connectedAt: status.connectedAt,
      scopes: status.scopes,
      timezone: status.timezone,
    };
  }

  async getCalendars(userId: string): Promise<CalendarList[]> {
    const { client } = await this.oauthService.getAuthenticatedClient(
      userId,
      this.integrationName,
    );
    const calendar = google.calendar({ version: 'v3', auth: client });

    try {
      const response = await calendar.calendarList.list();

      return (
        response.data.items?.map((cal) =>
          CalendarMapper.toCalendarListDto(cal),
        ) || []
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
    const { client } = await this.oauthService.getAuthenticatedClient(
      userId,
      this.integrationName,
    );
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
        response.data.items?.map((event) => CalendarMapper.toEventDto(event)) ||
        []
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
    const { client } = await this.oauthService.getAuthenticatedClient(
      userId,
      this.integrationName,
    );
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

      return CalendarMapper.toEventDto(response.data);
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
    const { client } = await this.oauthService.getAuthenticatedClient(
      userId,
      this.integrationName,
    );
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

      return CalendarMapper.toEventDto(response.data);
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
    const { client } = await this.oauthService.getAuthenticatedClient(
      userId,
      this.integrationName,
    );
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

      return CalendarFormatter.formatForAiContext(events, daysAhead);
    } catch (error) {
      this.logger.error('Failed to get events for AI context:', error);
      return 'Nie udało się pobrać wydarzeń z kalendarza.';
    }
  }
}
