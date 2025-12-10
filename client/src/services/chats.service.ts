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

export async function getChatHistory(limit?: number): Promise<ChatHistoryItem[]> {
  try {
    const params = limit ? { limit: limit.toString() } : {};
    const response = await apiClient.get<ChatHistoryItem[]>('/ai/chat-history', { params });
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(error, 'Błąd podczas pobierania historii czatów');
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

export async function getOrCreateCurrentChat(): Promise<{ chatId: string }> {
  try {
    const response = await apiClient.get<{ chatId: string }>('/ai/chats/current');
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania aktualnego chatu',
    );
    throw new Error(errorMessage);
  }
}

export async function saveChat(transcript: string, reply: string): Promise<void> {
  try {
    await apiClient.post('/ai/chats/save', { transcript, reply });
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas zapisywania chatu',
    );
    throw new Error(errorMessage);
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  try {
    await apiClient.delete(`/ai/chats/${chatId}`);
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas usuwania chatu',
    );
    throw new Error(errorMessage);
  }
}


