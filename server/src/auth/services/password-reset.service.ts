import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { PasswordUtils } from '../../common/utils/password.utils';
import { DateUtils } from '../../common/utils/date.utils';
import { UserUtils } from '../utils/user.utils';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private static readonly RESET_TOKEN_EXPIRY_HOURS = 1;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.findLocalUserByEmail(email);

    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent or OAuth user: ${email}`,
      );
      return this.getPasswordResetResponse();
    }

    const resetToken = this.generateResetToken();
    const resetTokenExpires = DateUtils.addHours(
      PasswordResetService.RESET_TOKEN_EXPIRY_HOURS,
    );

    await this.updateUserResetToken(user.id, resetToken, resetTokenExpires);

    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      await this.clearUserResetToken(user.id);
      this.logger.error(
        `Failed to send password reset email to ${email}:`,
        error,
      );
      throw new Error('Nie udało się wysłać emaila z resetem hasła');
    }

    return this.getPasswordResetResponse();
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findUserByResetToken(token);

    if (!user) {
      throw new UnauthorizedException(
        'Nieprawidłowy lub wygasły token resetu hasła',
      );
    }

    const hashedPassword = await PasswordUtils.hash(newPassword);
    await this.updateUserPassword(user.id, hashedPassword);

    this.logger.log(`Password reset for user: ${user.id}`);
    return { message: 'Hasło zostało zresetowane pomyślnie' };
  }

  private async findLocalUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return UserUtils.isLocalUser(user) ? user : null;
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

  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async updateUserResetToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
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

  private async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  private getPasswordResetResponse(): { message: string } {
    return {
      message:
        'Jeśli konto z tym emailem istnieje, otrzymasz email z instrukcjami resetu hasła',
    };
  }
}
