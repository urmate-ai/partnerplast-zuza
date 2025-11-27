import { apiClient } from '../shared/utils/api';

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
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas pobierania integracji';
    throw new Error(errorMessage);
  }
}

