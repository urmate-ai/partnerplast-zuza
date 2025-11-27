import { apiClient } from '../shared/utils/api';
import type { ChatHistoryItem } from '../shared/types';

export async function getChats(search?: string): Promise<ChatHistoryItem[]> {
  try {
    const params = search ? { search } : {};
    const response = await apiClient.get<ChatHistoryItem[]>('/ai/chats', { params });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas pobierania czatów';
    throw new Error(errorMessage);
  }
}


