import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LocalAuthService } from './services/local-auth.service';
import { OAuthService } from './services/oauth.service';
import { UserService } from './services/user.service';
import type {
  AuthResponse,
  UpdateProfileData,
  UpdateNotificationsData,
  UserProfile,
} from './types/auth.types';
import type { GoogleProfile } from './types/oauth.types';

describe('AuthService', () => {
  let service: AuthService;
  let localAuthService: jest.Mocked<LocalAuthService>;
  let oauthService: jest.Mocked<OAuthService>;
  let userService: jest.Mocked<UserService>;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'jwt-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: LocalAuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            changePassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: OAuthService,
          useValue: {
            validateGoogleUser: jest.fn(),
            verifyGoogleToken: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            validateUser: jest.fn(),
            getProfile: jest.fn(),
            updateProfile: jest.fn(),
            updateNotifications: jest.fn(),
            logout: jest.fn(),
            getAllUsers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    localAuthService = module.get(LocalAuthService);
    oauthService = module.get(OAuthService);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('powinien przekazać wywołanie do LocalAuthService', async () => {
      localAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await service.register(
        'Test User',
        'test@example.com',
        'password123',
      );

      expect(localAuthService.register).toHaveBeenCalledWith(
        'Test User',
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('powinien przekazać wywołanie do LocalAuthService', async () => {
      localAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await service.login('test@example.com', 'password123');

      expect(localAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('changePassword', () => {
    it('powinien przekazać wywołanie do LocalAuthService', async () => {
      const result = { message: 'Password changed' };
      localAuthService.changePassword.mockResolvedValue(result);

      const response = await service.changePassword('user-123', 'old', 'new');

      expect(localAuthService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'old',
        'new',
      );
      expect(response).toEqual(result);
    });
  });

  describe('validateGoogleUser', () => {
    it('powinien przekazać wywołanie do OAuthService', async () => {
      const mockProfile: GoogleProfile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }],
        provider: 'google',
      };

      oauthService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      const result = await service.validateGoogleUser(mockProfile);

      expect(oauthService.validateGoogleUser).toHaveBeenCalledWith(mockProfile);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('verifyGoogleToken', () => {
    it('powinien przekazać wywołanie do OAuthService', async () => {
      oauthService.verifyGoogleToken.mockResolvedValue(mockAuthResponse);

      const result = await service.verifyGoogleToken('google-token');

      expect(oauthService.verifyGoogleToken).toHaveBeenCalledWith(
        'google-token',
      );
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getProfile', () => {
    it('powinien przekazać wywołanie do UserService', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      userService.getProfile.mockResolvedValue(mockProfile as UserProfile);

      const result = await service.getProfile('user-123');

      expect(userService.getProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('powinien przekazać wywołanie do UserService', async () => {
      const updateData: UpdateProfileData = { name: 'New Name' };
      const updatedProfile = { id: 'user-123', name: 'New Name' };

      userService.updateProfile.mockResolvedValue(
        updatedProfile as UserProfile,
      );

      const result = await service.updateProfile('user-123', updateData);

      expect(userService.updateProfile).toHaveBeenCalledWith(
        'user-123',
        updateData,
      );
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('updateNotifications', () => {
    it('powinien przekazać wywołanie do UserService', async () => {
      const updateData: UpdateNotificationsData = { pushNotifications: false };
      const updatedProfile = { id: 'user-123', pushNotifications: false };

      userService.updateNotifications.mockResolvedValue(
        updatedProfile as UserProfile,
      );

      const result = await service.updateNotifications('user-123', updateData);

      expect(userService.updateNotifications).toHaveBeenCalledWith(
        'user-123',
        updateData,
      );
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('logout', () => {
    it('powinien przekazać wywołanie do UserService', async () => {
      const result = { message: 'Logged out' };
      userService.logout.mockResolvedValue(result);

      const response = await service.logout('user-123');

      expect(userService.logout).toHaveBeenCalledWith('user-123');
      expect(response).toEqual(result);
    });
  });

  describe('getAllUsers', () => {
    it('powinien przekazać wywołanie do UserService', async () => {
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }];
      userService.getAllUsers.mockResolvedValue(
        mockUsers as Array<
          Pick<
            UserProfile,
            'id' | 'email' | 'name' | 'provider' | 'createdAt' | 'updatedAt'
          >
        >,
      );

      const result = await service.getAllUsers();

      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });
});
