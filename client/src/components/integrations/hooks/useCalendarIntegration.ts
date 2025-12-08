import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCalendarAuthUrl,
  getCalendarStatus,
  disconnectCalendar,
  type CalendarConnectionStatus,
} from '../../../services/calendar.service';

WebBrowser.maybeCompleteAuthSession();

export function useCalendarIntegration(enabled: boolean) {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    data: status,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery<CalendarConnectionStatus>({
    queryKey: ['calendar', 'status'],
    queryFn: getCalendarStatus,
    enabled,
    staleTime: 30 * 1000, 
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!enabled) return;

    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === 'integrations') {
        const calendarStatus = queryParams?.calendar as string | undefined;

        if (calendarStatus === 'success') {
          setIsConnecting(false);
          
          queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] });
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          
          Alert.alert(
            'Sukces!',
            'Google Calendar został pomyślnie połączony.',
            [{ text: 'OK' }],
          );
        } else if (calendarStatus === 'error') {
          setIsConnecting(false);
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
      setIsConnecting(true);

      const { authUrl } = await getCalendarAuthUrl();

      const redirectUrl = Linking.createURL('integrations');
      console.log('Calendar redirect URL:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        {
          preferEphemeralSession: false,
        }
      );

      console.log('Calendar auth result:', result);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setIsConnecting(false);
        return;
      }

    } catch (error) {
      console.error('Calendar connection error:', error);
      setIsConnecting(false);
      const errorMessage =
        error instanceof Error ? error.message : 'Nieznany błąd';

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
              setIsConnecting(true);

              await disconnectCalendar();
                
              queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] });
              queryClient.invalidateQueries({ queryKey: ['integrations'] });

              setIsConnecting(false);

              Alert.alert(
                'Rozłączono',
                'Google Calendar został pomyślnie rozłączony.',
                [{ text: 'OK' }],
              );
            } catch (error) {
              console.error('Calendar disconnection error:', error);
              setIsConnecting(false);
              const errorMessage =
                error instanceof Error ? error.message : 'Nieznany błąd';

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
    isConnected: status?.isConnected ?? false,
    connectedEmail: status?.email,
    isLoading: isLoadingStatus || isConnecting,
    error: statusError ? (statusError instanceof Error ? statusError.message : 'Nieznany błąd') : null,
    handleConnect,
    handleDisconnect,
  };
}

