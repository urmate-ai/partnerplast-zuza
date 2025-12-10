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
    const { token, isAuthenticated } = useAuthStore.getState();
    if (token && isAuthenticated) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[apiClient] ⚠️ Próba wykonania żądania bez autoryzacji:', config.url);
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
      const requestUrl = error.config?.url || '';
      
      // Lista endpointów, które mogą zwrócić 401 bez wylogowywania użytkownika
      const noLogoutEndpoints = [
        '/auth/me',              // Weryfikacja tokenu
        '/integrations/',        // Wszystkie endpointy integracji (Gmail, Calendar, itp.)
      ];
      
      const shouldNotLogout = noLogoutEndpoints.some(endpoint => requestUrl.includes(endpoint));
      
      if (shouldNotLogout) {
        if (requestUrl.includes('/auth/me')) {
          console.log('[apiClient] ℹ️ Token nieważny podczas weryfikacji');
        } else {
          console.log('[apiClient] ℹ️ Błąd autoryzacji dla integracji - integracja nie jest podłączona lub token wygasł');
        }
      } else {
        console.warn('[apiClient] ⚠️ Błąd autoryzacji (401) - wylogowywanie użytkownika');
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  },
);

