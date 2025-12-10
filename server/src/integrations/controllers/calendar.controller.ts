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
  async initiateAuth(
    @CurrentUser() user: CurrentUserPayload,
    @Query('expoRedirectUri') expoRedirectUri?: string,
  ) {
    const result = await this.calendarService.generateAuthUrl(
      user.id,
      expoRedirectUri,
    );
    return result;
  }

  @Get('callback')
  async handleCallback(
    @Query() query: CalendarCallbackDto,
    @Res() res: Response,
  ) {
    try {
      const { redirectUri } = await this.calendarService.handleCallback(
        query.code ?? '',
        query.state ?? '',
      );

      const deepLink = redirectUri
        ? `${redirectUri}?calendar=success`
        : 'urmate-ai-zuza://integrations?calendar=success';
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Google Calendar połączony</title>
          </head>
          <body>
            <script>
              window.location.replace('${deepLink}');
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Calendar callback:', error);

      const errorDeepLink = 'urmate-ai-zuza://integrations?calendar=error';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Błąd połączenia Google Calendar</title>
          </head>
          <body>
            <script>
              window.location.replace('${errorDeepLink}');
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
