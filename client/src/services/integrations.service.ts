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
  } catch (error) {
    let errorMessage = 'Błąd podczas pobierania integracji';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
      errorMessage = errorObj?.response?.data?.message || errorObj?.message || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
}


