import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGmailAuthUrl,
  getGmailStatus,
  disconnectGmail,
  type GmailConnectionStatus,
} from '../../../services/gmail.service';

WebBrowser.maybeCompleteAuthSession();

type GmailIntegrationState = {
  isConnected: boolean;
  connectedEmail?: string;
  isLoading: boolean;
  error: string | null;
};

export const useGmailIntegration = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<GmailIntegrationState>({
    isConnected: false,
    isLoading: false,
    error: null,
  });

  // Pobierz status połączenia przy montowaniu
  useEffect(() => {
    if (!enabled) return;

    const fetchStatus = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const status = await getGmailStatus();
        setState({
          isConnected: status.isConnected,
          connectedEmail: status.email,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to fetch Gmail status:', error);
        setState({
          isConnected: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Nieznany błąd',
        });
      }
    };

    fetchStatus();
  }, [enabled]);

  // Obsługa deep linka z callbacku
  useEffect(() => {
    if (!enabled) return;

    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);

      if (path === 'integrations') {
        const gmailStatus = queryParams?.gmail as string | undefined;

        if (gmailStatus === 'success') {
          setState((prev) => ({ ...prev, isLoading: true }));
          
          // Odśwież status po udanym połączeniu
          getGmailStatus()
            .then((status) => {
              setState({
                isConnected: status.isConnected,
                connectedEmail: status.email,
                isLoading: false,
                error: null,
              });
              
              // Invalidate queries
              queryClient.invalidateQueries({ queryKey: ['integrations'] });
              
              Alert.alert(
                'Sukces!',
                'Gmail został pomyślnie połączony.',
                [{ text: 'OK' }]
              );
            })
            .catch((error) => {
              console.error('Failed to refresh Gmail status:', error);
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Nieznany błąd',
              }));
            });
        } else if (gmailStatus === 'error') {
          setState((prev) => ({ ...prev, isLoading: false }));
          Alert.alert(
            'Błąd',
            'Nie udało się połączyć z Gmail. Spróbuj ponownie.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Sprawdź initial URL (jeśli aplikacja została otwarta przez deep link)
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

      // Pobierz URL autoryzacji z backendu
      const { authUrl } = await getGmailAuthUrl();

      // Otwórz przeglądarkę z URL autoryzacji
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('integrations')
      );

      // Jeśli użytkownik anulował
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Callback zostanie obsłużony przez deep link listener
    } catch (error) {
      console.error('Gmail connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

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
              setState((prev) => ({ ...prev, isLoading: true, error: null }));

              await disconnectGmail();

              setState({
                isConnected: false,
                connectedEmail: undefined,
                isLoading: false,
                error: null,
              });

              // Invalidate queries
              queryClient.invalidateQueries({ queryKey: ['integrations'] });

              Alert.alert(
                'Rozłączono',
                'Gmail został pomyślnie rozłączony.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Gmail disconnection error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
              
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
              }));

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
    isConnected: state.isConnected,
    connectedEmail: state.connectedEmail,
    isLoading: state.isLoading,
    error: state.error,
    handleConnect,
    handleDisconnect,
  };
};

