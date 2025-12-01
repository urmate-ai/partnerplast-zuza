import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';
import {
  getCalendarAuthUrl,
  getCalendarStatus,
  disconnectCalendar,
} from '../../../services/calendar.service';

WebBrowser.maybeCompleteAuthSession();

type CalendarIntegrationState = {
  isConnected: boolean;
  connectedEmail?: string;
  isLoading: boolean;
  error: string | null;
};

export function useCalendarIntegration(enabled: boolean) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<CalendarIntegrationState>({
    isConnected: false,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    const fetchStatus = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const status = await getCalendarStatus();
        setState({
          isConnected: status.isConnected,
          connectedEmail: status.email,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch Calendar status:', error);
        setState({
          isConnected: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Nieznany błąd',
        });
      }
    };

    fetchStatus();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === 'integrations') {
        const calendarStatus = queryParams?.calendar as string | undefined;

        if (calendarStatus === 'success') {
          setState((prev) => ({ ...prev, isLoading: true }));

          getCalendarStatus()
            .then((status) => {
              setState({
                isConnected: status.isConnected,
                connectedEmail: status.email,
                isLoading: false,
                error: null,
              });

              queryClient.invalidateQueries({ queryKey: ['integrations'] });
              queryClient.invalidateQueries({ queryKey: ['calendar'] });

              Alert.alert(
                'Sukces!',
                'Google Calendar został pomyślnie połączony.',
                [{ text: 'OK' }],
              );
            })
            .catch((error) => {
              console.error('Failed to refresh Calendar status:', error);
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Nieznany błąd',
              }));
            });
        } else if (calendarStatus === 'error') {
          setState((prev) => ({ ...prev, isLoading: false }));
          Alert.alert(
            'Błąd',
            'Nie udało się połączyć z Google Calendar. Spróbuj ponownie.',
            [{ text: 'OK' }],
          );
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, queryClient]);

  const handleConnect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { authUrl } = await getCalendarAuthUrl();

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('integrations'),
      );

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

    } catch (error) {
      console.error('Calendar connection error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Nieznany błąd';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      Alert.alert(
        'Błąd połączenia',
        `Nie udało się połączyć z Google Calendar: ${errorMessage}`,
        [{ text: 'OK' }],
      );
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    Alert.alert(
      'Rozłącz Google Calendar',
      'Czy na pewno chcesz rozłączyć swoje konto Google Calendar? Stracisz dostęp do funkcji związanych z kalendarzem.',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Rozłącz',
          style: 'destructive',
          onPress: async () => {
            try {
              setState((prev) => ({ ...prev, isLoading: true, error: null }));

              await disconnectCalendar();

              setState({
                isConnected: false,
                connectedEmail: undefined,
                isLoading: false,
                error: null,
              });

              queryClient.invalidateQueries({ queryKey: ['integrations'] });
              queryClient.invalidateQueries({ queryKey: ['calendar'] });

              Alert.alert(
                'Rozłączono',
                'Google Calendar został pomyślnie rozłączony.',
                [{ text: 'OK' }],
              );
            } catch (error) {
              console.error('Calendar disconnection error:', error);
              const errorMessage =
                error instanceof Error ? error.message : 'Nieznany błąd';

              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
              }));

              Alert.alert(
                'Błąd',
                `Nie udało się rozłączyć Google Calendar: ${errorMessage}`,
                [{ text: 'OK' }],
              );
            }
          },
        },
      ],
    );
  }, [queryClient]);

  return {
    isConnected: state.isConnected,
    connectedEmail: state.connectedEmail,
    isLoading: state.isLoading,
    error: state.error,
    handleConnect,
    handleDisconnect,
  };
}

