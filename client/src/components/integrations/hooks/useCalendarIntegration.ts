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
import { getApiErrorMessage } from '../../../shared/types/api.types';

WebBrowser.maybeCompleteAuthSession();

export function useCalendarIntegration(enabled: boolean) {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    data: status,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery<CalendarConnectionStatus>({
    queryKey: ['calendar', 'status'],
    queryFn: getCalendarStatus,
    enabled,
    staleTime: 5 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!enabled) return;

    const handleDeepLink = async (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === 'integrations') {
        const calendarStatus = queryParams?.calendar as string | undefined;

        if (calendarStatus === 'success') {
          console.log('[Calendar] Deep link success detected, refetching status...');
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] }),
            queryClient.invalidateQueries({ queryKey: ['integrations'] }),
          ]);
            
          await refetchStatus();
          
          setIsConnecting(false);
          
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
        void handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, queryClient, refetchStatus]);

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
        console.log('[Calendar] OAuth result.url:', result.url);

        if (result.url.includes('urmate-ai-zuza://') || result.url.includes('integrations')) {
          console.log('[Calendar] Deep link detected, will be handled by useEffect');
          return;
        }
        
        if (result.url.includes('/integrations/calendar/callback')) {
          console.log('[Calendar] Server callback URL detected, refetching status...');
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['calendar', 'status'] }),
            queryClient.invalidateQueries({ queryKey: ['integrations'] }),
          ]);
          
          await refetchStatus();
          
          setIsConnecting(false);
          Alert.alert('Sukces!', 'Google Calendar został pomyślnie połączony.', [{ text: 'OK' }]);
          return;
        }
      } else if (result.type === 'cancel') {
        console.log('[Calendar] OAuth cancelled by user');
        setIsConnecting(false);
        return;
      } else if (result.type === 'dismiss') {
        console.log('[Calendar] OAuth dismissed');
        setIsConnecting(false);
        return;
      }

      setIsConnecting(false);

    } catch (error) {
      console.error('Calendar connection error:', error);
      setIsConnecting(false);
      const errorMessage = getApiErrorMessage(error, 'Nieznany błąd');

      Alert.alert(
        'Błąd połączenia',
        `Nie udało się połączyć z Google Calendar: ${errorMessage}`,
        [{ text: 'OK' }],
      );
    }
  }, [queryClient, refetchStatus]);

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
              const errorMessage = getApiErrorMessage(error, 'Nieznany błąd');

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
    isLoading: isConnecting,
    error: statusError ? (statusError instanceof Error ? statusError.message : 'Nieznany błąd') : null,
    handleConnect,
    handleDisconnect,
  };
}

