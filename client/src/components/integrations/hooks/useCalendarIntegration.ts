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

      const deepLink = Linking.createURL('integrations');
      const serverCallbackUrl = `${process.env.EXPO_PUBLIC_API_URL || 'https://partnerplast-zuza.onrender.com'}/api/v1/integrations/calendar/callback`;
      
      console.log('Calendar deep link:', deepLink);
      console.log('Calendar server callback URL:', serverCallbackUrl);

      const { authUrl } = await getCalendarAuthUrl(deepLink);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        serverCallbackUrl,
        {
          preferEphemeralSession: false,
        }
      );

      console.log('Calendar auth result:', result);

      if (result.type === 'success' && result.url) {
        console.log('Calendar auth result.url:', result.url);
        
        if (result.url.includes('urmate-ai-zuza://') || result.url.includes('integrations')) {
          const { path, queryParams } = Linking.parse(result.url);
          
          if (path === 'integrations' || result.url.includes('integrations')) {
            const calendarStatus = queryParams?.calendar as string | undefined;
            
            if (calendarStatus === 'success') {
              queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] });
              queryClient.invalidateQueries({ queryKey: ['integrations'] });
              Alert.alert('Sukces!', 'Google Calendar został pomyślnie połączony.', [{ text: 'OK' }]);
            } else if (calendarStatus === 'error') {
              Alert.alert('Błąd', 'Nie udało się połączyć z Google Calendar. Spróbuj ponownie.', [{ text: 'OK' }]);
            }
          }
        } else if (result.url.includes('/integrations/calendar/callback')) {
          console.log('Calendar callback URL detected, checking status...');
          queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] });
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          
          setTimeout(async () => {
            try {
              const status = await getCalendarStatus();
              if (status.isConnected) {
                Alert.alert('Sukces!', 'Google Calendar został pomyślnie połączony.', [{ text: 'OK' }]);
              }
            } catch (e) {
              console.error('Error checking Calendar status:', e);
            }
          }, 1000);
        }
      } else if (result.type === 'cancel') {
        console.log('Calendar auth cancelled by user');
      }

      setIsConnecting(false);

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
  }, [queryClient]);

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

