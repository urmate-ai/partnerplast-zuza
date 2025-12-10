import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { useAuthStore } from '../authStore';
import type { User } from '../authStore';

jest.mock('expo-secure-store');
jest.mock('axios');

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,
    });

    mockedAxios.get.mockReset();
  });

  describe('setAuth', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };
    const mockToken = 'token123';

    it('should set auth state and save to secure store', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setAuth(mockUser, mockToken);
      });

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', mockToken);
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(mockUser),
      );
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle secure store error gracefully', async () => {
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.setAuth(mockUser, mockToken);
      });

      expect(mockSecureStore.setItemAsync).toHaveBeenCalled();
    });
  });

  describe('clearAuth', () => {
    it('should clear auth state and remove from secure store', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.clearAuth();
      });

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_user');
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle secure store error gracefully', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.clearAuth();
      });

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  describe('loadAuth', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    };
    const mockToken = 'token123';

    it('should load auth from secure store if available', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(mockToken)
        .mockResolvedValueOnce(JSON.stringify(mockUser));

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockUser,
        },
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadAuth();
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 },
      );

      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('auth_user');
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set isLoading to false if no auth data found', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const { result, unmount } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadAuth();
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 },
      );

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockedAxios.get).not.toHaveBeenCalled();
      
      unmount();
    });

    it('should handle secure store error gracefully', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const { result, unmount } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadAuth();
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 },
      );

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
      
      unmount();
    });

    it('should handle invalid JSON in user data', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(mockToken)
        .mockResolvedValueOnce('invalid json');

      const { result, unmount } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loadAuth();
      });

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 },
      );

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
      
      unmount();
    });
  });
});

