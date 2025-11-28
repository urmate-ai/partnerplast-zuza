import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLogin, useRegister, useLogout } from '../useAuth.hook';
import { apiClient } from '../../../utils/api';
import { useAuthStore } from '../../../../stores/authStore';
import { logout as logoutService } from '../../../../services/auth.service';
import type { AuthState } from '../../../../stores/authStore';

jest.mock('../../../../utils/api');
jest.mock('../../../../stores/authStore');
jest.mock('../../../../services/auth.service');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockLogoutService = logoutService as jest.MockedFunction<typeof logoutService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useAuth.hook', () => {
  const mockSetAuth = jest.fn();
  const mockClearAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useLogin', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockAuthResponse = {
      accessToken: 'token123',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    it('should login user successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: mockAuthResponse,
      } as never);

      mockUseAuthStore.mockImplementation((selector: (state: AuthState) => unknown) => {
        const mockState: AuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          setAuth: mockSetAuth,
          clearAuth: mockClearAuth,
          loadAuth: jest.fn(),
        };
        return selector(mockState) as never;
      });

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockLoginData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSetAuth).toHaveBeenCalledWith(
        mockAuthResponse.user,
        mockAuthResponse.accessToken,
      );
    });

    it('should handle login error', async () => {
      const error = new Error('Login failed');
      mockApiClient.post.mockRejectedValue(error);

      mockUseAuthStore.mockImplementation((selector: (state: AuthState) => unknown) => {
        const mockState: AuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          setAuth: mockSetAuth,
          clearAuth: mockClearAuth,
          loadAuth: jest.fn(),
        };
        return selector(mockState) as never;
      });

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockLoginData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useRegister', () => {
    const mockRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockAuthResponse = {
      accessToken: 'token123',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    it('should register user successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: mockAuthResponse,
      } as never);

      mockUseAuthStore.mockImplementation((selector: (state: AuthState) => unknown) => {
        const mockState: AuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          setAuth: mockSetAuth,
          clearAuth: mockClearAuth,
          loadAuth: jest.fn(),
        };
        return selector(mockState) as never;
      });

      const { result } = renderHook(() => useRegister(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockRegisterData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSetAuth).toHaveBeenCalledWith(
        mockAuthResponse.user,
        mockAuthResponse.accessToken,
      );
    });

    it('should handle registration error', async () => {
      const error = new Error('Registration failed');
      mockApiClient.post.mockRejectedValue(error);

      mockUseAuthStore.mockImplementation((selector: (state: AuthState) => unknown) => {
        const mockState: AuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          setAuth: mockSetAuth,
          clearAuth: mockClearAuth,
          loadAuth: jest.fn(),
        };
        return selector(mockState) as never;
      });

      const { result } = renderHook(() => useRegister(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockRegisterData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useLogout', () => {
    it('should logout successfully', async () => {
      mockLogoutService.mockResolvedValue({ message: 'Wylogowano' });
      mockUseAuthStore.mockImplementation((selector: (state: AuthState) => unknown) => {
        const mockState: AuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          setAuth: mockSetAuth,
          clearAuth: mockClearAuth,
          loadAuth: jest.fn(),
        };
        return selector(mockState) as never;
      });

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockClearAuth).toHaveBeenCalled();
    });

    it('should clear auth on error', async () => {
      const error = new Error('Logout failed');
      mockLogoutService.mockRejectedValue(error);
      mockUseAuthStore.mockImplementation((selector: (state: AuthState) => unknown) => {
        const mockState: AuthState = {
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          setAuth: mockSetAuth,
          clearAuth: mockClearAuth,
          loadAuth: jest.fn(),
        };
        return selector(mockState) as never;
      });

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockClearAuth).toHaveBeenCalled();
    });
  });
});
