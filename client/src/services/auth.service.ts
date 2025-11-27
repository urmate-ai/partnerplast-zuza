import { apiClient } from '../shared/utils/api';
import type { RegisterData, LoginData, AuthResponse } from '../shared/types';

export type { RegisterData, LoginData, AuthResponse };

export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas rejestracji';
    throw new Error(errorMessage);
  }
}

export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas logowania';
    throw new Error(errorMessage);
  }
}

export async function getProfile() {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas pobierania profilu';
    throw new Error(errorMessage);
  }
}

export async function logout() {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (error: any) {
    console.error('Logout error:', error);
    return { message: 'Wylogowano' };
  }
}
