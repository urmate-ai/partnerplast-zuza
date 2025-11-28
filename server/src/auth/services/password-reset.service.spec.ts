import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { PasswordUtils } from '../../common/utils/password.utils';
import { UserUtils } from '../utils/user.utils';

jest.mock('../../common/utils/password.utils');
jest.mock('../utils/user.utils');

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prismaService: jest.Mocked<PrismaService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockUser = {
    id: mockUserId,
    email: mockEmail,
    provider: 'local',
    password: 'hashed-password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('powinien wygenerować token i wysłać email', async () => {
      (UserUtils.isLocalUser as jest.Mock).mockReturnValue(true);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);
      (prismaService.user.update as jest.Mock).mockResolvedValue({} as any);
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.requestPasswordReset(mockEmail);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        },
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toContain('otrzymasz email');
    });

    it('powinien zwrócić bezpieczną odpowiedź gdy użytkownik nie istnieje', async () => {
      (UserUtils.isLocalUser as jest.Mock).mockReturnValue(false);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.requestPasswordReset('nonexistent@example.com');

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('otrzymasz email');
    });

    it('powinien wyczyścić token gdy wysyłka emaila się nie powiedzie', async () => {
      (UserUtils.isLocalUser as jest.Mock).mockReturnValue(true);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser as any);
      (prismaService.user.update as jest.Mock).mockResolvedValue({} as any);
      emailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email error'));

      await expect(service.requestPasswordReset(mockEmail)).rejects.toThrow(
        'Nie udało się wysłać emaila z resetem hasła',
      );

      expect(prismaService.user.update).toHaveBeenCalledTimes(2);
      expect(prismaService.user.update).toHaveBeenLastCalledWith({
        where: { id: mockUserId },
        data: {
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('powinien zresetować hasło używając tokenu', async () => {
      const resetToken = 'valid-token-123';
      const newPassword = 'newPassword123';
      const hashedPassword = 'hashed-new-password';

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser as any);
      (PasswordUtils.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prismaService.user.update as jest.Mock).mockResolvedValue({} as any);

      const result = await service.resetPassword(resetToken, newPassword);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: { gt: expect.any(Date) },
        },
      });
      expect(PasswordUtils.hash).toHaveBeenCalledWith(newPassword);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });
      expect(result.message).toBe('Hasło zostało zresetowane pomyślnie');
    });

    it('powinien rzucić błąd gdy token jest nieprawidłowy', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword('invalid-token', 'newPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('powinien rzucić błąd gdy token wygasł', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword('expired-token', 'newPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

