import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplates } from '../templates/email.templates';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');
jest.mock('../templates/email.templates');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: {
    sendMail: jest.Mock;
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                SMTP_USER: 'test@example.com',
                SMTP_PASS: 'password123',
                SMTP_HOST: 'smtp.example.com',
                SMTP_PORT: '465',
                SMTP_FROM: 'noreply@example.com',
                FRONTEND_URL: 'https://app.example.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPasswordResetEmail', () => {
    it('powinien wysłać email z resetem hasła', async () => {
      const email = 'user@example.com';
      const resetToken = 'test-token-123';
      const resetUrl = `urmate-ai-zuza://reset-password?token=${resetToken}`;

      (EmailTemplates.passwordReset as jest.Mock).mockReturnValue('<html>Reset</html>');
      (EmailTemplates.passwordResetText as jest.Mock).mockReturnValue('Reset text');

      await service.sendPasswordResetEmail(email, resetToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: email,
        subject: 'Reset hasła - Zuza Team',
        html: '<html>Reset</html>',
        text: 'Reset text',
      });
      expect(EmailTemplates.passwordReset).toHaveBeenCalledWith(resetUrl);
      expect(EmailTemplates.passwordResetText).toHaveBeenCalledWith(resetUrl);
    });

    it('powinien rzucić błąd gdy SMTP nie jest skonfigurowany', async () => {
      const moduleWithoutConfig = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      const serviceWithoutConfig = moduleWithoutConfig.get<EmailService>(EmailService);

      await expect(
        serviceWithoutConfig.sendPasswordResetEmail('test@example.com', 'token'),
      ).rejects.toThrow('Konfiguracja SMTP nie jest ustawiona');
    });

    it('powinien obsłużyć błąd wysyłki emaila', async () => {
      const email = 'user@example.com';
      const resetToken = 'test-token-123';

      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      await expect(service.sendPasswordResetEmail(email, resetToken)).rejects.toThrow(
        'Nie udało się wysłać emaila z resetem hasła',
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('powinien wysłać email powitalny', async () => {
      const email = 'newuser@example.com';
      const name = 'Jan Kowalski';

      (EmailTemplates.welcome as jest.Mock).mockReturnValue('<html>Welcome</html>');
      (EmailTemplates.welcomeText as jest.Mock).mockReturnValue('Welcome text');

      await service.sendWelcomeEmail(email, name);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: email,
        subject: 'Witamy w Zuza Team! 🎉',
        html: '<html>Welcome</html>',
        text: 'Welcome text',
      });
      expect(EmailTemplates.welcome).toHaveBeenCalledWith(name, 'https://app.example.com');
      expect(EmailTemplates.welcomeText).toHaveBeenCalledWith(name, 'https://app.example.com');
    });

    it('powinien zignorować błąd gdy SMTP nie jest skonfigurowany', async () => {
      const moduleWithoutConfig = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      }).compile();

      const serviceWithoutConfig = moduleWithoutConfig.get<EmailService>(EmailService);

      await expect(
        serviceWithoutConfig.sendWelcomeEmail('test@example.com', 'Test User'),
      ).resolves.not.toThrow();
    });
  });
});

