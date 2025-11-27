import { useQuery } from '@tanstack/react-query';
import { getChats } from '../../services/chats.service';
import type { ChatHistoryItem } from '../types';

export const useChatHistory = () => {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: async (): Promise<ChatHistoryItem[]> => {
      return getChats();
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });
};

