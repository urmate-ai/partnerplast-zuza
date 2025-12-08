import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGmailAuthUrl,
  getGmailStatus,
  disconnectGmail,
  getGmailMessages,
  sendEmail,
  getGmailContext,
  type GmailConnectionStatus,
  type GmailMessage,
  type SendEmailRequest,
  type SendEmailResponse,
  type GmailContextResponse,
} from '../../../services/gmail.service';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

export const GMAIL_QUERY_KEYS = {
  status: ['gmail', 'status'] as const,
  messages: (maxResults?: number) =>
    ['gmail', 'messages', maxResults] as const,
  context: (maxResults?: number) =>
    ['gmail', 'context', maxResults] as const,
};

export function useGmailStatus() {
  return useQuery<GmailConnectionStatus>({
    queryKey: GMAIL_QUERY_KEYS.status,
    queryFn: getGmailStatus,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGmailMessages(maxResults = 10) {
  return useQuery<GmailMessage[]>({
    queryKey: GMAIL_QUERY_KEYS.messages(maxResults),
    queryFn: () => getGmailMessages(maxResults),
    enabled: false,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGmailConnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { authUrl } = await getGmailAuthUrl();
      
      const redirectUrl = Linking.createURL('integrations');
      console.log('Gmail connect redirect URL:', redirectUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        { 
          preferEphemeralSession: false,
        }
      );

      console.log('Gmail connect result:', result);

      if (result.type !== 'success') {
        throw new Error('Autoryzacja została anulowana');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GMAIL_QUERY_KEYS.status });
    },
  });
}

export function useGmailDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => {  
      queryClient.invalidateQueries({ queryKey: ['gmail'] });
    },
  });
}

export function useGmailSend() {
  const queryClient = useQueryClient();

  return useMutation<SendEmailResponse, Error, SendEmailRequest>({
    mutationFn: sendEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GMAIL_QUERY_KEYS.messages() });
      Alert.alert('Sukces', 'Email został wysłany pomyślnie!');
    },
    onError: (error) => {
      Alert.alert('Błąd', error.message || 'Nie udało się wysłać emaila');
    },
  });
}

export function useGmailContext(maxResults = 20) {
  return useQuery<GmailContextResponse>({
    queryKey: GMAIL_QUERY_KEYS.context(maxResults),
    queryFn: () => getGmailContext(maxResults),
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });
}

