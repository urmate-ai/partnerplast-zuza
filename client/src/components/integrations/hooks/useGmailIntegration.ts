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
        console.log('Gmail auth result.url:', result.url);
        
        if (result.url.includes('urmate-ai-zuza://') || result.url.includes('integrations')) {
          const { path, queryParams } = Linking.parse(result.url);
          
          if (path === 'integrations' || result.url.includes('integrations')) {
            const gmailStatus = queryParams?.gmail as string | undefined;
            
            if (gmailStatus === 'success') {
              queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] });
              queryClient.invalidateQueries({ queryKey: ['integrations'] });
              Alert.alert('Sukces!', 'Gmail został pomyślnie połączony.', [{ text: 'OK' }]);
            } else if (gmailStatus === 'error') {
              Alert.alert('Błąd', 'Nie udało się połączyć z Gmail. Spróbuj ponownie.', [{ text: 'OK' }]);
            }
          }
        } else if (result.url.includes('/integrations/gmail/callback')) {
          console.log('Gmail callback URL detected, checking status...');
          queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] });
          queryClient.invalidateQueries({ queryKey: ['integrations'] });
          
          setTimeout(async () => {
            try {
              const status = await getGmailStatus();
              if (status.isConnected) {
                Alert.alert('Sukces!', 'Gmail został pomyślnie połączony.', [{ text: 'OK' }]);
              }
            } catch (e) {
              console.error('Error checking Gmail status:', e);
            }
          }, 1000);
        }
      } else if (result.type === 'cancel') {
        console.log('Gmail auth cancelled by user');
      }

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
  }, [queryClient]);

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

