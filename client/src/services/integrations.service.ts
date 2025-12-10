import { apiClient } from '../shared/utils/api';
import { getApiErrorMessage } from '../shared/types/api.types';

export type Integration = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getIntegrations(search?: string): Promise<Integration[]> {
  try {
    const params = search ? { search } : {};
    const response = await apiClient.get<Integration[]>('/integrations', { params });
    return response.data;
  } catch (error) {
    const errorMessage = getApiErrorMessage(error, 'Błąd podczas pobierania integracji');
    throw new Error(errorMessage);
  }
}


