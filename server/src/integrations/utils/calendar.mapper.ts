import type { calendar_v3 } from 'googleapis';
import type { CalendarEvent, CalendarList } from '../types/calendar.types';

export class CalendarMapper {
  static toEventDto(event: calendar_v3.Schema$Event): CalendarEvent {
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
      recurringEventId: event.recurringEventId || undefined,
      isAllDay: !event.start?.dateTime && !!event.start?.date,
    };
  }

  static toCalendarListDto(
    calendar: calendar_v3.Schema$CalendarListEntry,
  ): CalendarList {
    return {
      id: calendar.id || '',
      summary: calendar.summary || 'Untitled Calendar',
      description: calendar.description || undefined,
      primary: calendar.primary || false,
      accessRole: calendar.accessRole || undefined,
      backgroundColor: calendar.backgroundColor || undefined,
      foregroundColor: calendar.foregroundColor || undefined,
    };
  }
}
