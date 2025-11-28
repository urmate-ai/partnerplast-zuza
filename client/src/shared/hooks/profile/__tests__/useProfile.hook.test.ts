import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useUpdateNotifications,
} from '../useProfile.hook';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateNotifications,
} from '../../../../services/auth.service';
import { useAuthStore } from '../../../../stores/authStore';
import type { UserProfile } from '../../../../services/auth.service';
import type { AuthState } from '../../../../stores/authStore';

jest.mock('../../../../services/auth.service');
jest.mock('../../../../stores/authStore');

const mockGetProfile = getProfile as jest.MockedFunction<typeof getProfile>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockChangePassword = changePassword as jest.MockedFunction<typeof changePassword>;
const mockUpdateNotifications = updateNotifications as jest.MockedFunction<
  typeof updateNotifications
>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const createWrapper = (queryClientsRef: QueryClient[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        gcTime: 0,
      },
      mutations: { 
        retry: false,
        gcTime: 0,
      },
    },
  });

  queryClientsRef.push(queryClient);

  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useProfile.hook', () => {
  const mockSetAuth = jest.fn();
  const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
  const mockToken = 'token123';
  const defaultMockState: AuthState = {
    user: mockUser,
    token: mockToken,
    isLoading: false,
    isAuthenticated: true,
    setAuth: mockSetAuth,
    clearAuth: jest.fn(),
    loadAuth: jest.fn(),
  };
  let queryClients: QueryClient[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    queryClients = [];
    mockUseAuthStore.mockImplementation((selector?: (state: AuthState) => unknown) => {
      if (selector && typeof selector === 'function') {
        return selector(defaultMockState) as never;
      }
      return defaultMockState as never;
    });
  });

  afterEach(async () => {
    await Promise.all(
      queryClients.map((client) => client.clear()),
    );
    queryClients = [];
    jest.clearAllTimers();
  });

  describe('useProfile', () => {
    const mockProfile: UserProfile = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'local',
      pushNotifications: true,
      emailNotifications: false,
      soundEnabled: true,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
    };

    it('should fetch profile successfully', async () => {
      mockGetProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(queryClients),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProfile);
      expect(mockGetProfile).toHaveBeenCalled();
    });

    it('should handle profile fetch error', async () => {
      const error = new Error('Profile fetch failed');
      mockGetProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(queryClients),
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 },
      );
      
      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpdateProfile', () => {
    const mockUpdateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    const mockUpdatedProfile: UserProfile = {
      id: '1',
      email: 'updated@example.com',
      name: 'Updated Name',
      provider: 'local',
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
    };

    it('should update profile successfully', async () => {
      mockUpdateProfile.mockResolvedValue(mockUpdatedProfile);

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(queryClients),
      });

      result.current.mutate(mockUpdateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUpdateData);
      expect(mockSetAuth).toHaveBeenCalledWith(
        {
          id: mockUpdatedProfile.id,
          email: mockUpdatedProfile.email,
          name: mockUpdatedProfile.name,
        },
        mockToken,
      );
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      mockUpdateProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(queryClients),
      });

      result.current.mutate(mockUpdateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useChangePassword', () => {
    const mockChangePasswordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
    };

    it('should change password successfully', async () => {
      mockChangePassword.mockResolvedValue({ message: 'Hasło zostało zmienione' });

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(queryClients),
      });

      result.current.mutate(mockChangePasswordData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockChangePassword).toHaveBeenCalledWith(mockChangePasswordData);
    });

    it('should handle change password error', async () => {
      const error = new Error('Change password failed');
      mockChangePassword.mockRejectedValue(error);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(queryClients),
      });

      result.current.mutate(mockChangePasswordData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateNotifications', () => {
    const mockNotificationData = {
      pushNotifications: true,
      emailNotifications: false,
      soundEnabled: true,
    };

    const mockUpdatedProfile: UserProfile = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'local',
      pushNotifications: true,
      emailNotifications: false,
      soundEnabled: true,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
    };

    it('should update notifications successfully', async () => {
      mockUpdateNotifications.mockResolvedValue(mockUpdatedProfile);

      const { result } = renderHook(() => useUpdateNotifications(), {
        wrapper: createWrapper(queryClients),
      });

      result.current.mutate(mockNotificationData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdateNotifications).toHaveBeenCalledWith(mockNotificationData);
    });

    it('should handle update notifications error', async () => {
      const error = new Error('Update notifications failed');
      mockUpdateNotifications.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateNotifications(), {
        wrapper: createWrapper(queryClients),
      });

      result.current.mutate(mockNotificationData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
