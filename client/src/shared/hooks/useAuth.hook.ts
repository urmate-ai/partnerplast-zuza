import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../utils/api';
import { useAuthStore } from '../../stores/authStore';
import type { AuthResponse, LoginData, RegisterData } from '../types';

const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  return useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      clearAuth();
    },
  });
};

