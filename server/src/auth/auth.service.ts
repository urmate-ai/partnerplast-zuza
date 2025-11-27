import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  iat?: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(name: string, email: string, password: string) {
    
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

  async login(email: string, password: string) {
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

  async validateGoogleUser(profile: any) {
    const email = profile.emails[0].value;
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.displayName,
          provider: 'google',
          providerId: profile.id,
        },
      });
      this.logger.log(`New Google user created: ${email}`);
    } else if (user.provider !== 'google') {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'google',
          providerId: profile.id,
        },
      });
    }

    return this.generateTokens(user);
  }

  async validateAppleUser(profile: any) {
    const email = profile.email;
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: profile.name || 'Apple User',
          provider: 'apple',
          providerId: profile.sub,
        },
      });
      this.logger.log(`New Apple user created: ${email}`);
    } else if (user.provider !== 'apple') {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'apple',
          providerId: profile.sub,
        },
      });
    }

    return this.generateTokens(user);
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return null;
    }


    const userWithLogout = user as User & { lastLogoutAt: Date | null };
    if (userWithLogout.lastLogoutAt && payload.iat !== undefined) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < userWithLogout.lastLogoutAt) {
        this.logger.warn(`Token invalidated for user ${user.id} - token issued before last logout`);
        return null;
      }
    }

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Użytkownik nie został znaleziony');
    }

    return user;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        lastLogoutAt: new Date(),
      } as any,
    });
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Wylogowano pomyślnie' };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  private generateTokens(user: User) {
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
