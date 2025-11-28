import {
  register,
  login,
  getProfile,
  logout,
  updateProfile,
  changePassword,
  updateNotifications,
} from '../auth.service';
import { apiClient } from '../../shared/utils/api';
import { getApiErrorMessage } from '../../shared/types/api.types';
import type { RegisterData, LoginData, UserProfile } from '../auth.service';

jest.mock('../../shared/utils/api');
jest.mock('../../shared/types/api.types');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockGetApiErrorMessage = getApiErrorMessage as jest.MockedFunction<
  typeof getApiErrorMessage
>;

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterData: RegisterData = {
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

      const result = await register(mockRegisterData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', mockRegisterData);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('Registration failed');
      mockApiClient.post.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('Registration failed');

      await expect(register(mockRegisterData)).rejects.toThrow('Registration failed');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(error, 'Błąd podczas rejestracji');
    });
  });

  describe('login', () => {
    const mockLoginData: LoginData = {
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

      const result = await login(mockLoginData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', mockLoginData);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('Login failed');
      mockApiClient.post.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('Login failed');

      await expect(login(mockLoginData)).rejects.toThrow('Login failed');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(error, 'Błąd podczas logowania');
    });
  });

  describe('getProfile', () => {
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
      mockApiClient.get.mockResolvedValue({
        data: mockProfile,
      } as never);

      const result = await getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockProfile);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('Profile fetch failed');
      mockApiClient.get.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('Profile fetch failed');

      await expect(getProfile()).rejects.toThrow('Profile fetch failed');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas pobierania profilu',
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { message: 'Wylogowano' },
      } as never);

      const result = await logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual({ message: 'Wylogowano' });
    });

    it('should return default message on error', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Logout failed'));

      const result = await logout();

      expect(result).toEqual({ message: 'Wylogowano' });
    });
  });

  describe('updateProfile', () => {
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
      mockApiClient.put.mockResolvedValue({
        data: mockUpdatedProfile,
      } as never);

      const result = await updateProfile(mockUpdateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/profile', mockUpdateData);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('Update failed');
      mockApiClient.put.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('Update failed');

      await expect(updateProfile(mockUpdateData)).rejects.toThrow('Update failed');
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas aktualizacji profilu',
      );
    });
  });

  describe('changePassword', () => {
    const mockChangePasswordData = {
      currentPassword: 'oldPassword',
      newPassword: 'newPassword',
    };

    it('should change password successfully', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { message: 'Hasło zostało zmienione' },
      } as never);

      const result = await changePassword(mockChangePasswordData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/auth/change-password',
        mockChangePasswordData,
      );
      expect(result).toEqual({ message: 'Hasło zostało zmienione' });
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('Change password failed');
      mockApiClient.post.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('Change password failed');

      await expect(changePassword(mockChangePasswordData)).rejects.toThrow(
        'Change password failed',
      );
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas zmiany hasła',
      );
    });
  });

  describe('updateNotifications', () => {
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
      mockApiClient.put.mockResolvedValue({
        data: mockUpdatedProfile,
      } as never);

      const result = await updateNotifications(mockNotificationData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/auth/notifications', mockNotificationData);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('should handle API errors correctly', async () => {
      const error = new Error('Update notifications failed');
      mockApiClient.put.mockRejectedValue(error);
      mockGetApiErrorMessage.mockReturnValue('Update notifications failed');

      await expect(updateNotifications(mockNotificationData)).rejects.toThrow(
        'Update notifications failed',
      );
      expect(mockGetApiErrorMessage).toHaveBeenCalledWith(
        error,
        'Błąd podczas aktualizacji ustawień powiadomień',
      );
    });
  });
});

