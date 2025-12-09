import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getGmailAuthUrl,
  getGmailStatus,
  disconnectGmail,
  type GmailConnectionStatus,
} from '../../../services/gmail.service';

WebBrowser.maybeCompleteAuthSession();

export const useGmailIntegration = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    data: status,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useQuery<GmailConnectionStatus>({
    queryKey: ['gmail', 'status'],
    queryFn: getGmailStatus,
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
        const gmailStatus = queryParams?.gmail as string | undefined;

        if (gmailStatus === 'success') {
          setIsConnecting(false);
          
          queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] });
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          
          Alert.alert(
            'Sukces!',
            'Gmail został pomyślnie połączony.',
            [{ text: 'OK' }]
          );
        } else if (gmailStatus === 'error') {
          setIsConnecting(false);
          Alert.alert(
            'Błąd',
            'Nie udało się połączyć z Gmail. Spróbuj ponownie.',
            [{ text: 'OK' }]
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

      const { authUrl } = await getGmailAuthUrl();

      const redirectUrl = Linking.createURL('integrations');
      console.log('Gmail redirect URL:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        {
          preferEphemeralSession: false,
        }
      );

      console.log('Gmail auth result:', result);

      setIsConnecting(false);

    } catch (error) {
      console.error('Gmail connection error:', error);
      setIsConnecting(false);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';

      Alert.alert(
        'Błąd połączenia',
        `Nie udało się połączyć z Gmail: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    Alert.alert(
      'Rozłącz Gmail',
      'Czy na pewno chcesz rozłączyć swoje konto Gmail? Stracisz dostęp do funkcji związanych z emailami.',
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

              await disconnectGmail();

              queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] });
              queryClient.invalidateQueries({ queryKey: ['integrations'] });

              setIsConnecting(false);

              Alert.alert(
                'Rozłączono',
                'Gmail został pomyślnie rozłączony.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Gmail disconnection error:', error);
              setIsConnecting(false);
              const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';

              Alert.alert(
                'Błąd',
                `Nie udało się rozłączyć Gmail: ${errorMessage}`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
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
};

