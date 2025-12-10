import axios, { AxiosResponse } from 'axios';
import { useAuthStore } from '../../stores/authStore';
import type { ApiSuccessResponse } from '../types/api.types';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://partnerplast-zuza.onrender.com';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessResponse<unknown>>) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
      return {
        ...response,
        data: response.data.data,
      } as AxiosResponse<unknown>;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);

