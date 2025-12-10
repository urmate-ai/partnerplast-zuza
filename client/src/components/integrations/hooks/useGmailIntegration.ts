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
import { getApiErrorMessage } from '../../../shared/types/api.types';

WebBrowser.maybeCompleteAuthSession();

export const useGmailIntegration = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    data: status,
    isLoading: isLoadingStatus,
    isFetching: isFetchingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery<GmailConnectionStatus>({
    queryKey: ['gmail', 'status'],
    queryFn: getGmailStatus,
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
        const gmailStatus = queryParams?.gmail as string | undefined;

        if (gmailStatus === 'success') {
          console.log('[Gmail] Deep link success detected, refetching status...');
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] }),
            queryClient.invalidateQueries({ queryKey: ['integrations'] }),
          ]);
          
          await refetchStatus();
          
          setIsConnecting(false);
          
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
      const serverCallbackUrl = `${process.env.EXPO_PUBLIC_API_URL || 'https://partnerplast-zuza.onrender.com'}/api/v1/integrations/gmail/callback`;
      
      console.log('Gmail deep link:', deepLink);
      console.log('Gmail server callback URL:', serverCallbackUrl);

      const { authUrl } = await getGmailAuthUrl(deepLink);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        serverCallbackUrl,
        {
          preferEphemeralSession: false,
        }
      );

      console.log('Gmail auth result:', result);

      if (result.type === 'success' && result.url) {
        console.log('[Gmail] OAuth result.url:', result.url);
        
        if (result.url.includes('urmate-ai-zuza://') || result.url.includes('integrations')) {
          console.log('[Gmail] Deep link detected, will be handled by useEffect');
          return;
        }
        
        if (result.url.includes('/integrations/gmail/callback')) {
          console.log('[Gmail] Server callback URL detected, refetching status...');
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] }),
            queryClient.invalidateQueries({ queryKey: ['integrations'] }),
          ]);
          
          await refetchStatus();
          
          setIsConnecting(false);
          Alert.alert('Sukces!', 'Gmail został pomyślnie połączony.', [{ text: 'OK' }]);
          return;
        }
      } else if (result.type === 'cancel') {
        console.log('[Gmail] OAuth cancelled by user');
        setIsConnecting(false);
        return;
      } else if (result.type === 'dismiss') {
        console.log('[Gmail] OAuth dismissed');
        setIsConnecting(false);
        return;
      }

      setIsConnecting(false);

    } catch (error) {
      console.error('Gmail connection error:', error);
      setIsConnecting(false);
      const errorMessage = getApiErrorMessage(error, 'Nieznany błąd');

      Alert.alert(
        'Błąd połączenia',
        `Nie udało się połączyć z Gmail: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    }
  }, [queryClient, refetchStatus]);

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
              const errorMessage = getApiErrorMessage(error, 'Nieznany błąd');

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
    isLoading: isConnecting,
    error: statusError ? (statusError instanceof Error ? statusError.message : 'Nieznany błąd') : null,
    handleConnect,
    handleDisconnect,
  };
};

