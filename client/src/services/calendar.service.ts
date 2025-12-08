import { apiClient } from '../shared/utils/api';
import { getApiErrorMessage } from '../shared/types/api.types';

export type CalendarConnectionStatus = {
  isConnected: boolean;
  email?: string;
  connectedAt?: string;
  scopes?: string[];
  timezone?: string;
};

export type CalendarList = {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
};

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  recurringEventId?: string;
  isAllDay?: boolean;
};

export type CalendarAuthResponse = {
  authUrl: string;
  state: string;
  expoRedirectUrl?: string;
};

export type CreateEventRequest = {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
};

export type UpdateEventRequest = {
  calendarId: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
};

export async function getCalendarAuthUrl(expoRedirectUri?: string): Promise<CalendarAuthResponse> {
  try {
    const response = await apiClient.get<CalendarAuthResponse>(
      '/integrations/calendar/auth',
      {
        params: expoRedirectUri ? { expoRedirectUri } : undefined,
      },
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas generowania URL autoryzacji Google Calendar',
    );
    throw new Error(errorMessage);
  }
}

export async function getCalendarStatus(): Promise<CalendarConnectionStatus> {
  try {
    const response = await apiClient.get<CalendarConnectionStatus>(
      '/integrations/calendar/status',
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania statusu Google Calendar',
    );
    throw new Error(errorMessage);
  }
}

export async function disconnectCalendar(): Promise<void> {
  try {
    await apiClient.delete('/integrations/calendar/disconnect');
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas rozłączania Google Calendar',
    );
    throw new Error(errorMessage);
  }
}

export async function getCalendars(): Promise<CalendarList[]> {
  try {
    const response = await apiClient.get<CalendarList[]>(
      '/integrations/calendar/calendars',
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania kalendarzy',
    );
    throw new Error(errorMessage);
  }
}

export async function getEvents(params?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<CalendarEvent[]> {
  try {
    const response = await apiClient.get<CalendarEvent[]>(
      '/integrations/calendar/events',
      {
        params,
      },
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania wydarzeń',
    );
    throw new Error(errorMessage);
  }
}

export async function createEvent(
  eventData: CreateEventRequest,
): Promise<CalendarEvent> {
  try {
    const response = await apiClient.post<CalendarEvent>(
      '/integrations/calendar/events',
      eventData,
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas tworzenia wydarzenia',
    );
    throw new Error(errorMessage);
  }
}

export async function updateEvent(
  eventId: string,
  eventData: UpdateEventRequest,
): Promise<CalendarEvent> {
  try {
    const response = await apiClient.put<CalendarEvent>(
      `/integrations/calendar/events/${eventId}`,
      eventData,
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas aktualizacji wydarzenia',
    );
    throw new Error(errorMessage);
  }
}

export async function deleteEvent(
  eventId: string,
  calendarId: string = 'primary',
): Promise<void> {
  try {
    await apiClient.delete(`/integrations/calendar/events/${eventId}`, {
      params: { calendarId },
    });
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas usuwania wydarzenia',
    );
    throw new Error(errorMessage);
  }
}

export type CalendarContextResponse = {
  context: string;
};

export async function getCalendarContext(
  daysAhead = 7,
): Promise<CalendarContextResponse> {
  try {
    const response = await apiClient.get<CalendarContextResponse>(
      '/integrations/calendar/context',
      {
        params: { daysAhead },
      },
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania kontekstu kalendarza',
    );
    throw new Error(errorMessage);
  }
}

