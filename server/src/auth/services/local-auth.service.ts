import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import type { AuthResponse, JwtPayload } from '../types/auth.types';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Użytkownik z tym emailem już istnieje');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        provider: 'local',
      },
    });

    this.logger.log(`User registered: ${email}`);

    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    this.logger.log(`User logged in: ${email}`);
    return this.generateTokens(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Użytkownik nie ma ustawionego hasła');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowe aktualne hasło');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed for user: ${userId}`);
    return { message: 'Hasło zostało zmienione pomyślnie' };
  }

  private generateTokens(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}

