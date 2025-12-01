import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  UseGuards,
  Res,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { CalendarService } from '../services/calendar/calendar.service';
import {
  CalendarCallbackDto,
  GetEventsDto,
  CreateEventDto,
  UpdateEventDto,
} from '../dto/calendar.dto';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../auth/decorators/current-user.decorator';

@Controller('integrations/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('auth')
  @UseGuards(AuthGuard('jwt'))
  initiateAuth(@CurrentUser() user: CurrentUserPayload) {
    const { authUrl } = this.calendarService.generateAuthUrl(user.id);
    return { authUrl };
  }

  @Get('callback')
  async handleCallback(
    @Query() query: CalendarCallbackDto,
    @Res() res: Response,
  ) {
    try {
      await this.calendarService.handleCallback(query.code, query.state);

      const deepLink = 'urmate-ai-zuza://integrations?calendar=success';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="0;url=${deepLink}">
            <title>Google Calendar połączony</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .link {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #2563EB;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
              }
              .link:hover {
                background: #1d4ed8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #10b981; margin-bottom: 10px;">✓</h1>
              <p style="font-size: 18px; margin-bottom: 10px;">Google Calendar został pomyślnie połączony!</p>
              <p style="color: #6b7280; margin-bottom: 20px;">Przekierowywanie do aplikacji...</p>
              <a href="${deepLink}" class="link">Otwórz aplikację</a>
            </div>
            <script>
              (function() {
                const url = '${deepLink}';
                
                // Metoda 1: Natychmiastowe przekierowanie przez location.replace (działa lepiej w Safari)
                try {
                  window.location.replace(url);
                } catch (e) {
                  console.error('location.replace failed:', e);
                }
                
                // Metoda 2: Fallback - kliknięcie w link (działa w większości przypadków)
                setTimeout(function() {
                  const link = document.createElement('a');
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  try {
                    link.click();
                  } catch (e) {
                    console.error('link.click failed:', e);
                  }
                  setTimeout(function() {
                    document.body.removeChild(link);
                  }, 100);
                }, 100);
                
                // Metoda 3: Ostatnia próba przez window.location.href
                setTimeout(function() {
                  try {
                    window.location.href = url;
                  } catch (e) {
                    console.error('location.href failed:', e);
                  }
                }, 300);
              })();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Calendar callback:', error);

      const deepLink = 'urmate-ai-zuza://integrations?calendar=error';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="0;url=${deepLink}">
            <title>Błąd połączenia Google Calendar</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .link {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #2563EB;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
              }
              .link:hover {
                background: #1d4ed8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #DC2626; margin-bottom: 10px;">✗</h1>
              <p style="font-size: 18px; margin-bottom: 10px; color: #DC2626;">Wystąpił błąd podczas łączenia z Google Calendar</p>
              <p style="color: #6b7280; margin-bottom: 20px;">Przekierowywanie do aplikacji...</p>
              <a href="${deepLink}" class="link">Otwórz aplikację</a>
            </div>
            <script>
              (function() {
                const url = '${deepLink}';
                
                // Metoda 1: Natychmiastowe przekierowanie przez location.replace
                try {
                  window.location.replace(url);
                } catch (e) {
                  console.error('location.replace failed:', e);
                }
                
                // Metoda 2: Fallback - kliknięcie w link
                setTimeout(function() {
                  const link = document.createElement('a');
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  try {
                    link.click();
                  } catch (e) {
                    console.error('link.click failed:', e);
                  }
                  setTimeout(function() {
                    document.body.removeChild(link);
                  }, 100);
                }, 100);
                
                // Metoda 3: Ostatnia próba przez window.location.href
                setTimeout(function() {
                  try {
                    window.location.href = url;
                  } catch (e) {
                    console.error('location.href failed:', e);
                  }
                }, 300);
              })();
            </script>
          </body>
        </html>
      `);
    }
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async getStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.calendarService.getConnectionStatus(user.id);
  }

  @Delete('disconnect')
  @UseGuards(AuthGuard('jwt'))
  async disconnect(@CurrentUser() user: CurrentUserPayload) {
    await this.calendarService.disconnectCalendar(user.id);
    return { message: 'Google Calendar disconnected successfully' };
  }

  @Get('calendars')
  @UseGuards(AuthGuard('jwt'))
  async getCalendars(@CurrentUser() user: CurrentUserPayload) {
    return this.calendarService.getCalendars(user.id);
  }

  @Get('events')
  @UseGuards(AuthGuard('jwt'))
  async getEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: GetEventsDto,
  ) {
    return this.calendarService.getEvents(
      user.id,
      query.calendarId || 'primary',
      query.timeMin,
      query.timeMax,
      query.maxResults || 50,
    );
  }

  @Post('events')
  @UseGuards(AuthGuard('jwt'))
  async createEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateEventDto,
  ) {
    return this.calendarService.createEvent(user.id, body.calendarId, {
      summary: body.summary,
      description: body.description,
      location: body.location,
      start: body.start,
      end: body.end,
      attendees: body.attendees,
    });
  }

  @Put('events/:eventId')
  @UseGuards(AuthGuard('jwt'))
  async updateEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('eventId') eventId: string,
    @Body() body: UpdateEventDto,
  ) {
    return this.calendarService.updateEvent(user.id, body.calendarId, eventId, {
      summary: body.summary,
      description: body.description,
      location: body.location,
      start: body.start,
      end: body.end,
      attendees: body.attendees,
    });
  }

  @Delete('events/:eventId')
  @UseGuards(AuthGuard('jwt'))
  async deleteEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('eventId') eventId: string,
    @Query('calendarId') calendarId: string,
  ) {
    await this.calendarService.deleteEvent(
      user.id,
      calendarId || 'primary',
      eventId,
    );
    return { message: 'Event deleted successfully' };
  }

  @Get('context')
  @UseGuards(AuthGuard('jwt'))
  async getContextForAi(
    @CurrentUser() user: CurrentUserPayload,
    @Query('daysAhead') daysAhead?: string,
  ) {
    const days = daysAhead ? parseInt(daysAhead, 10) : 7;
    const context = await this.calendarService.getEventsForAiContext(
      user.id,
      days,
    );
    return { context };
  }
}
