import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../utils/api';
import type { ChatHistoryItem } from '../types';

export const useChatHistory = () => {
  return useQuery({
    queryKey: ['chatHistory'],
    queryFn: async (): Promise<ChatHistoryItem[]> => {
      const response = await apiClient.get<ChatHistoryItem[]>('/ai/chat-history');
      return response.data;
    },
  });
};

