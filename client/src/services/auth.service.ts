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
    return { message: 'Wylogowano' };
  }
}

export type UpdateProfileData = {
  name?: string;
  email?: string;
};

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  provider: string;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  soundEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateNotificationsData = {
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  soundEnabled?: boolean;
};

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
  try {
    const response = await apiClient.put<UserProfile>('/auth/profile', data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas aktualizacji profilu';
    throw new Error(errorMessage);
  }
}

export async function changePassword(data: ChangePasswordData): Promise<{ message: string }> {
  try {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas zmiany hasła';
    throw new Error(errorMessage);
  }
}

export async function updateNotifications(
  data: UpdateNotificationsData,
): Promise<UserProfile> {
  try {
    const response = await apiClient.put<UserProfile>('/auth/notifications', data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Błąd podczas aktualizacji ustawień powiadomień';
    throw new Error(errorMessage);
  }
}
