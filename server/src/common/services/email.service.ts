import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP credentials not configured. Email functionality will be disabled. ' +
        'Please set SMTP_USER and SMTP_PASS environment variables.',
      );
      return;
    }

    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'urmate.ai';
    const smtpPortRaw = this.configService.get<string>('SMTP_PORT') || this.configService.get<number>('SMTP_PORT') || '465';
    const smtpPort = Number(smtpPortRaw);
    const isSecurePort = smtpPort === 465;

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecurePort,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    this.logger.log(`SMTP transporter configured for ${smtpHost}:${smtpPort} (secure: ${isSecurePort})`);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    if (!this.transporter) {
      this.logger.error(
        'Cannot send email: SMTP transporter not configured. ' +
        'Please set SMTP_USER and SMTP_PASS environment variables.',
      );
      throw new Error('Konfiguracja SMTP nie jest ustawiona. Skontaktuj się z administratorem.');
    }

    const resetUrl = `urmate-ai-zuza://reset-password?token=${resetToken}`;
    const smtpFrom = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');

    if (!smtpFrom) {
      this.logger.error('SMTP_FROM is not configured');
      throw new Error('Konfiguracja SMTP nie jest ustawiona. Skontaktuj się z administratorem.');
    }

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: 'Reset hasła - Zuza Team',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
            <h1 style="color: #111827; margin-bottom: 20px;">Reset hasła</h1>
            <p style="color: #4b5563; margin-bottom: 20px;">
              Otrzymaliśmy prośbę o reset hasła dla Twojego konta.
            </p>
            <p style="color: #4b5563; margin-bottom: 30px;">
              Kliknij poniższy przycisk, aby zresetować hasło:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Zresetuj hasło
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Link wygaśnie za 1 godzinę.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:<br>
              <a href="${resetUrl}" style="color: #111827; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset hasła - Zuza Team
        
        Otrzymaliśmy prośbę o reset hasła dla Twojego konta.
        
        Kliknij poniższy link, aby zresetować hasło:
        ${resetUrl}
        
        Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Link wygaśnie za 1 godzinę.
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Nie udało się wysłać emaila z resetem hasła');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        'Cannot send welcome email: SMTP transporter not configured. ' +
        'User registration will continue without email notification.',
      );
      return;
    }

    const smtpFrom = this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER');

    if (!smtpFrom) {
      this.logger.warn('SMTP_FROM is not configured. Welcome email will not be sent.');
      return;
    }

    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'urmate-ai-zuza://';

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: 'Witamy w Zuza Team! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px;">
            <h1 style="color: #111827; margin-bottom: 20px;">Witaj, ${name}! 👋</h1>
            <p style="color: #4b5563; margin-bottom: 20px;">
              Dziękujemy za dołączenie do Zuza Team! Cieszymy się, że jesteś z nami.
            </p>
            <p style="color: #4b5563; margin-bottom: 20px;">
              Twoje konto zostało pomyślnie utworzone. Możesz teraz korzystać z wszystkich funkcji naszej aplikacji:
            </p>
            <ul style="color: #4b5563; margin-bottom: 30px; padding-left: 20px;">
              <li style="margin-bottom: 10px;">🎤 Rozmawiaj z AI za pomocą głosu</li>
              <li style="margin-bottom: 10px;">💬 Otrzymuj inteligentne odpowiedzi na swoje pytania</li>
              <li style="margin-bottom: 10px;">📝 Zapisz historię swoich rozmów</li>
              <li style="margin-bottom: 10px;">⚙️ Dostosuj ustawienia do swoich potrzeb</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}" 
                 style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Rozpocznij korzystanie
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Jeśli masz pytania lub potrzebujesz pomocy, skontaktuj się z nami. Jesteśmy tutaj, aby pomóc!
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Pozdrawiamy,<br>
              <strong>Zespół Zuza Team</strong>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Witaj, ${name}!
        
        Dziękujemy za dołączenie do Zuza Team! Cieszymy się, że jesteś z nami.
        
        Twoje konto zostało pomyślnie utworzone. Możesz teraz korzystać z wszystkich funkcji naszej aplikacji:
        - Rozmawiaj z AI za pomocą głosu
        - Otrzymuj inteligentne odpowiedzi na swoje pytania
        - Zapisz historię swoich rozmów
        - Dostosuj ustawienia do swoich potrzeb
        
        Rozpocznij korzystanie: ${appUrl}
        
        Jeśli masz pytania lub potrzebujesz pomocy, skontaktuj się z nami. Jesteśmy tutaj, aby pomóc!
        
        Pozdrawiamy,
        Zespół Zuza Team
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
    }
  }
}

