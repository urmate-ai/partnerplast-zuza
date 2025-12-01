import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGmailAuthUrl,
  getGmailStatus,
  disconnectGmail,
  getGmailMessages,
  type GmailConnectionStatus,
  type GmailMessage,
} from '../../../services/gmail.service';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export const GMAIL_QUERY_KEYS = {
  status: ['gmail', 'status'] as const,
  messages: (maxResults?: number) =>
    ['gmail', 'messages', maxResults] as const,
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
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('/integrations'),
      );

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

