import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { LocalAuthService } from './local-auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { ChatService } from '../../ai/services/chat.service';
import { TokenService } from '../../common/services/token.service';
import { PasswordResetService } from './password-reset.service';
import { PasswordUtils } from '../../common/utils/password.utils';
import type { PrismaUpdateResult } from '../../common/types/test.types';
import type { User } from '@prisma/client';

jest.mock('../../common/utils/password.utils');
jest.mock('../utils/user.utils');

describe('LocalAuthService', () => {
  let service: LocalAuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let emailService: jest.Mocked<EmailService>;
  let chatService: jest.Mocked<ChatService>;
  let tokenService: jest.Mocked<TokenService>;
  let passwordResetService: jest.Mocked<PasswordResetService>;

  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockPassword = 'password123';
  const mockHashedPassword = 'hashed-password';
  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    name: 'Test User',
    password: mockHashedPassword,
    provider: 'local',
  };

  const mockAuthResponse = {
    accessToken: 'jwt-token',
    user: {
      id: mockUserId,
      email: mockEmail,
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalAuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
        {
          provide: ChatService,
          useValue: {
            createNewChat: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokenResult: jest.fn(),
          },
        },
        {
          provide: PasswordResetService,
          useValue: {
            requestPasswordReset: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LocalAuthService>(LocalAuthService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
    chatService = module.get(ChatService);
    tokenService = module.get(TokenService);
    passwordResetService = module.get(PasswordResetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('powinien zarejestrować nowego użytkownika', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (PasswordUtils.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
      (prismaService.user.create as jest.Mock).mockResolvedValue(
        mockUser as User,
      );
      emailService.sendWelcomeEmail.mockResolvedValue(undefined);
      tokenService.generateTokenResult.mockReturnValue(mockAuthResponse);

      const result = await service.register(
        'Test User',
        mockEmail,
        mockPassword,
      );

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(PasswordUtils.hash).toHaveBeenCalledWith(mockPassword);
      expect(prismaService.user.create as jest.Mock).toHaveBeenCalledWith({
        data: {
          email: mockEmail,
          name: 'Test User',
          password: mockHashedPassword,
          provider: 'local',
        },
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        mockEmail,
        'Test User',
      );
      expect(result).toEqual(mockAuthResponse);
    });

    it('powinien rzucić ConflictException gdy email już istnieje', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as User | null,
      );

      await expect(
        service.register('Test User', mockEmail, mockPassword),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('powinien zalogować użytkownika z poprawnymi danymi', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as User | null,
      );
      (PasswordUtils.compare as jest.Mock).mockResolvedValue(true);
      chatService.createNewChat.mockResolvedValue('chat-id');
      tokenService.generateTokenResult.mockReturnValue(mockAuthResponse);

      const result = await service.login(mockEmail, mockPassword);

      expect(PasswordUtils.compare).toHaveBeenCalledWith(
        mockPassword,
        mockHashedPassword,
      );
      expect(chatService.createNewChat).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockAuthResponse);
    });

    it('powinien rzucić UnauthorizedException gdy użytkownik nie istnieje', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(mockEmail, mockPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('powinien rzucić UnauthorizedException gdy hasło jest nieprawidłowe', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as User | null,
      );
      (PasswordUtils.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(mockEmail, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('powinien zmienić hasło użytkownika', async () => {
      const currentPassword = 'oldPassword';
      const newPassword = 'newPassword';
      const newHashedPassword = 'new-hashed-password';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as User | null,
      );
      (PasswordUtils.compare as jest.Mock).mockResolvedValue(true);
      (PasswordUtils.hash as jest.Mock).mockResolvedValue(newHashedPassword);
      const mockUpdateResult: PrismaUpdateResult = { id: mockUserId };
      (prismaService.user.update as jest.Mock).mockResolvedValue(
        mockUpdateResult as User,
      );

      const result = await service.changePassword(
        mockUserId,
        currentPassword,
        newPassword,
      );

      expect(PasswordUtils.compare).toHaveBeenCalledWith(
        currentPassword,
        mockHashedPassword,
      );
      expect(PasswordUtils.hash).toHaveBeenCalledWith(newPassword);
      expect(prismaService.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { password: newHashedPassword },
      });
      expect(result.message).toBe('Hasło zostało zmienione pomyślnie');
    });

    it('powinien rzucić UnauthorizedException gdy aktualne hasło jest nieprawidłowe', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as User | null,
      );
      (PasswordUtils.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(mockUserId, 'wrong-password', 'new-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('powinien przekazać wywołanie do PasswordResetService', async () => {
      const result = { message: 'Email sent' };
      passwordResetService.requestPasswordReset.mockResolvedValue(result);

      const response = await service.forgotPassword(mockEmail);

      expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith(
        mockEmail,
      );
      expect(response).toEqual(result);
    });
  });

  describe('resetPassword', () => {
    it('powinien przekazać wywołanie do PasswordResetService', async () => {
      const token = 'reset-token';
      const newPassword = 'new-password';
      const result = { message: 'Password reset' };
      passwordResetService.resetPassword.mockResolvedValue(result);

      const response = await service.resetPassword(token, newPassword);

      expect(passwordResetService.resetPassword).toHaveBeenCalledWith(
        token,
        newPassword,
      );
      expect(response).toEqual(result);
    });
  });
});
