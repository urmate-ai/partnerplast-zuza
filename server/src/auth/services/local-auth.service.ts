import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { ChatService } from '../../ai/services/chat.service';
import { TokenService } from '../../common/services/token.service';
import { PasswordUtils } from '../../common/utils/password.utils';
import { DateUtils } from '../../common/utils/date.utils';
import { UserUtils } from '../utils/user.utils';
import type { AuthResponse } from '../types/auth.types';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);
  private static readonly RESET_TOKEN_EXPIRY_HOURS = 1;

  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    await this.validateEmailNotExists(email);

    const hashedPassword = await PasswordUtils.hash(password);
    const user = await this.createLocalUser(email, name, hashedPassword);

    this.logger.log(`User registered: ${email}`);

    await this.sendWelcomeEmailSafely(email, name);

    return this.tokenService.generateTokenResult(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.findUserByEmail(email);
    this.validateUserForLogin(user, password);

    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    this.logger.log(`User logged in: ${email}`);

    await this.ensureUserHasChat(user.id);

    return this.tokenService.generateTokenResult(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.findLocalUserByEmail(email);

    if (!user) {
      this.logger.warn(`Password reset requested for non-existent or OAuth user: ${email}`);
      return this.getPasswordResetResponse();
    }

    const resetToken = this.generateResetToken();
    const resetTokenExpires = DateUtils.addHours(LocalAuthService.RESET_TOKEN_EXPIRY_HOURS);

    await this.updateUserResetToken(user.id, resetToken, resetTokenExpires);

    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      await this.clearUserResetToken(user.id);
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Nie udało się wysłać emaila z resetem hasła');
    }

    return this.getPasswordResetResponse();
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.findUserByResetToken(token);

    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy lub wygasły token resetu hasła');
    }

    const hashedPassword = await PasswordUtils.hash(newPassword);
    await this.updateUserPassword(user.id, hashedPassword);

    this.logger.log(`Password reset for user: ${user.id}`);
    return { message: 'Hasło zostało zresetowane pomyślnie' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findUserById(userId);
    this.validateUserHasPassword(user);
    await this.validateCurrentPassword(user, currentPassword);

    const hashedPassword = await PasswordUtils.hash(newPassword);
    await this.updateUserPassword(userId, hashedPassword);

    this.logger.log(`Password changed for user: ${userId}`);
    return { message: 'Hasło zostało zmienione pomyślnie' };
  }

  private async validateEmailNotExists(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Użytkownik z tym emailem już istnieje');
    }
  }

  private async createLocalUser(email: string, name: string, hashedPassword: string) {
    return this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        provider: 'local',
      },
    });
  }

  private async sendWelcomeEmailSafely(email: string, name: string): Promise<void> {
    try {
      await this.emailService.sendWelcomeEmail(email, name);
    } catch (error) {
      this.logger.warn(`Failed to send welcome email to ${email}, but user registration succeeded:`, error);
    }
  }

  private async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  private async findLocalUserByEmail(email: string) {
    const user = await this.findUserByEmail(email);
    return UserUtils.isLocalUser(user) ? user : null;
  }

  private async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  private async findUserByResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });
  }

  private async validateUserForLogin(user: any, password: string): Promise<void> {
    if (!user || !user.password) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    const isPasswordValid = await PasswordUtils.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }
  }

  private validateUserHasPassword(user: any): void {
    if (!user || !user.password) {
      throw new UnauthorizedException('Użytkownik nie ma ustawionego hasła');
    }
  }

  private async validateCurrentPassword(user: any, currentPassword: string): Promise<void> {
    const isPasswordValid = await PasswordUtils.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowe aktualne hasło');
    }
  }

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async updateUserResetToken(userId: string, token: string, expires: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
  }

  private async clearUserResetToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  private async ensureUserHasChat(userId: string): Promise<void> {
    try {
      await this.chatService.createNewChat(userId);
    } catch (error) {
      this.logger.warn(`Failed to create new chat for user ${userId}, but login succeeded:`, error);
    }
  }

  private getPasswordResetResponse(): { message: string } {
    return { message: 'Jeśli konto z tym emailem istnieje, otrzymasz email z instrukcjami resetu hasła' };
  }
}
