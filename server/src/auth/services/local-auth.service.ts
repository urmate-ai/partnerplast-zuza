import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { ChatService } from '../../ai/services/chat.service';
import { TokenService } from '../../common/services/token.service';
import { PasswordResetService } from './password-reset.service';
import { PasswordUtils } from '../../common/utils/password.utils';
import { UserUtils } from '../utils/user.utils';
import type { AuthResponse } from '../types/auth.types';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly chatService: ChatService,
    private readonly passwordResetService: PasswordResetService,
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
    return this.passwordResetService.requestPasswordReset(email);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.passwordResetService.resetPassword(token, newPassword);
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

  private async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
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

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  private async ensureUserHasChat(userId: string): Promise<void> {
    try {
      await this.chatService.createNewChat(userId);
    } catch (error) {
      this.logger.warn(`Failed to create new chat for user ${userId}, but login succeeded:`, error);
    }
  }

}
