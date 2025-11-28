import { apiClient } from '../shared/utils/api';
import type { RegisterData, LoginData, AuthResponse } from '../shared/types';
import { getApiErrorMessage } from '../shared/types/api.types';

export type { RegisterData, LoginData, AuthResponse };

export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(error, 'Błąd podczas rejestracji');
    throw new Error(errorMessage);
  }
}

export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(error, 'Błąd podczas logowania');
    throw new Error(errorMessage);
  }
}

export async function getProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania profilu',
    );
    throw new Error(errorMessage);
  }
}

export async function logout(): Promise<{ message: string }> {
  try {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    return response.data;
  } catch {
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
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas aktualizacji profilu',
    );
    throw new Error(errorMessage);
  }
}

export async function changePassword(data: ChangePasswordData): Promise<{ message: string }> {
  try {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas zmiany hasła',
    );
    throw new Error(errorMessage);
  }
}

export async function updateNotifications(
  data: UpdateNotificationsData,
): Promise<UserProfile> {
  try {
    const response = await apiClient.put<UserProfile>('/auth/notifications', data);
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas aktualizacji ustawień powiadomień',
    );
    throw new Error(errorMessage);
  }
}

export async function deleteAccount(): Promise<{ message: string }> {
  try {
    const response = await apiClient.delete<{ message: string }>('/auth/account');
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas usuwania konta',
    );
    throw new Error(errorMessage);
  }
}
