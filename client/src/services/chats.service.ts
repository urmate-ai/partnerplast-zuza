import { apiClient } from '../shared/utils/api';
import type { ChatHistoryItem, ChatWithMessages } from '../shared/types';

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

export async function getChatById(chatId: string): Promise<ChatWithMessages> {
  try {
    const response = await apiClient.get<ChatWithMessages>(`/ai/chats/${chatId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas pobierania czatu';
    throw new Error(errorMessage);
  }
}


