import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EmailTemplates } from '../templates/email.templates';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly config: SmtpConfig | null = null;

  constructor(private readonly configService: ConfigService) {
    this.config = this.initializeSmtpConfig();
    if (this.config) {
      this.transporter = this.createTransporter(this.config);
    }
  }

  private initializeSmtpConfig(): SmtpConfig | null {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP credentials not configured. Email functionality will be disabled. ' +
          'Please set SMTP_USER and SMTP_PASS environment variables.',
      );
      return null;
    }

    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'urmate.ai';
    const smtpPortRaw =
      this.configService.get<string>('SMTP_PORT') || this.configService.get<number>('SMTP_PORT') || '465';
    const smtpPort = Number(smtpPortRaw);
    const isSecurePort = smtpPort === 465;
    const smtpFrom = this.configService.get<string>('SMTP_FROM') || smtpUser;

    return {
      host: smtpHost,
      port: smtpPort,
      secure: isSecurePort,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom,
    };
  }

  private createTransporter(config: SmtpConfig): Transporter {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    this.logger.log(`SMTP transporter configured for ${config.host}:${config.port} (secure: ${config.secure})`);
    return transporter;
  }

  private ensureTransporter(): Transporter {
    if (!this.transporter || !this.config) {
      const errorMessage =
        'SMTP transporter not configured. Please set SMTP_USER and SMTP_PASS environment variables.';
      this.logger.error(`Cannot send email: ${errorMessage}`);
      throw new Error('Konfiguracja SMTP nie jest ustawiona. Skontaktuj się z administratorem.');
    }
    return this.transporter;
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const transporter = this.ensureTransporter();
    const resetUrl = `urmate-ai-zuza://reset-password?token=${resetToken}`;

    const mailOptions = {
      from: this.config!.from,
      to: email,
      subject: 'Reset hasła - Zuza Team',
      html: EmailTemplates.passwordReset(resetUrl),
      text: EmailTemplates.passwordResetText(resetUrl),
    };

    try {
      await transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Nie udało się wysłać emaila z resetem hasła');
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    if (!this.transporter || !this.config) {
      this.logger.warn(
        'Cannot send welcome email: SMTP transporter not configured. ' +
          'User registration will continue without email notification.',
      );
      return;
    }

    const appUrl = this.configService.get<string>('FRONTEND_URL') || 'urmate-ai-zuza://';

    const mailOptions = {
      from: this.config.from,
      to: email,
      subject: 'Witamy w Zuza Team! 🎉',
      html: EmailTemplates.welcome(name, appUrl),
      text: EmailTemplates.welcomeText(name, appUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
    }
  }
}
