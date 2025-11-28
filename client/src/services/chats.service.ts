import { apiClient } from '../shared/utils/api';
import type { ChatHistoryItem, ChatWithMessages } from '../shared/types';
import { getApiErrorMessage } from '../shared/types/api.types';

export async function getChats(search?: string): Promise<ChatHistoryItem[]> {
  try {
    const params = search ? { search } : {};
    const response = await apiClient.get<ChatHistoryItem[]>('/ai/chats', { params });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(error, 'Błąd podczas pobierania czatów');
    throw new Error(errorMessage);
  }
}

export async function getChatById(chatId: string): Promise<ChatWithMessages> {
  try {
    const response = await apiClient.get<ChatWithMessages>(`/ai/chats/${chatId}`);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(error, 'Błąd podczas pobierania czatu');
    throw new Error(errorMessage);
  }
}

export async function createNewChat(): Promise<{ chatId: string }> {
  try {
    const response = await apiClient.post<{ chatId: string }>('/ai/chats/new');
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas tworzenia nowego chatu',
    );
    throw new Error(errorMessage);
  }
}


