import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCalendarAuthUrl,
  getCalendarStatus,
  disconnectCalendar,
  getCalendars,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type CalendarConnectionStatus,
  type CalendarList,
  type CalendarEvent,
  type CreateEventRequest,
  type UpdateEventRequest,
} from '../../../services/calendar.service';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

export const CALENDAR_QUERY_KEYS = {
  status: ['calendar', 'status'] as const,
  calendars: ['calendar', 'calendars'] as const,
  events: (calendarId?: string, timeMin?: string, timeMax?: string) =>
    ['calendar', 'events', calendarId, timeMin, timeMax] as const,
};

export function useCalendarStatus() {
  return useQuery<CalendarConnectionStatus>({
    queryKey: CALENDAR_QUERY_KEYS.status,
    queryFn: getCalendarStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCalendars() {
  return useQuery<CalendarList[]>({
    queryKey: CALENDAR_QUERY_KEYS.calendars,
    queryFn: getCalendars,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCalendarEvents(params?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}) {
  return useQuery<CalendarEvent[]>({
    queryKey: CALENDAR_QUERY_KEYS.events(
      params?.calendarId,
      params?.timeMin,
      params?.timeMax,
    ),
    queryFn: () => getEvents(params),
    enabled: false,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCalendarConnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { authUrl } = await getCalendarAuthUrl();

      // Użyj Linking.createURL dla lepszej kompatybilności
      const redirectUrl = Linking.createURL('integrations');
      console.log('Calendar connect redirect URL:', redirectUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        {
          // Dla iOS - wymusza użycie ASWebAuthenticationSession
          preferEphemeralSession: false,
        }
      );

      console.log('Calendar connect result:', result);

      if (result.type !== 'success') {
        throw new Error('Autoryzacja została anulowana');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.status });
    },
  });
}

export function useCalendarDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation<CalendarEvent, Error, CreateEventRequest>({
    mutationFn: (eventData: CreateEventRequest) => createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      Alert.alert('Sukces', 'Wydarzenie zostało dodane do kalendarza!');
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message || 'Nie udało się dodać wydarzenia');
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      eventData,
    }: {
      eventId: string;
      eventData: UpdateEventRequest;
    }) => updateEvent(eventId, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      calendarId = 'primary',
    }: {
      eventId: string;
      calendarId?: string;
    }) => deleteEvent(eventId, calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
    },
  });
}

