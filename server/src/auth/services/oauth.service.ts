import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../../ai/services/chat.service';
import { TokenService } from '../../common/services/token.service';
import { UserUtils } from '../utils/user.utils';
import { OAuth2Client } from 'google-auth-library';
import type { User } from '@prisma/client';
import type { GoogleProfile, GoogleAuthResult } from '../types/oauth.types';

interface GoogleUserInfo {
  email: string;
  name: string;
  sub: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  async validateGoogleUser(profile: GoogleProfile): Promise<GoogleAuthResult> {
    const email = UserUtils.extractEmailFromGoogleProfile(profile.emails);
    if (!email) {
      throw new Error('Email not found in Google profile');
    }

    const user = await this.findOrCreateGoogleUser(email, profile.displayName, profile.id);
    await this.ensureUserHasChat(user.id);

    return this.tokenService.generateTokenResult(user);
  }

  async verifyGoogleToken(accessToken: string): Promise<GoogleAuthResult> {
    try {
      const userInfo = await this.fetchGoogleUserInfo(accessToken);
      const user = await this.findOrCreateGoogleUser(userInfo.email, userInfo.name, userInfo.sub);
      await this.ensureUserHasChat(user.id);

      return this.tokenService.generateTokenResult(user);
    } catch (error) {
      this.logger.error('Google token verification failed:', error);
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  private async fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
    );

    if (!userInfoResponse.ok) {
      throw new UnauthorizedException('Invalid Google access token');
    }

    const userInfo = await userInfoResponse.json();

    if (!userInfo.email) {
      throw new UnauthorizedException('Email not found in Google profile');
    }

    return {
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      sub: userInfo.sub,
    };
  }

  private async findOrCreateGoogleUser(
    email: string,
    name: string,
    providerId: string,
  ): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.createGoogleUser(email, name, providerId);
      this.logger.log(`New Google user created: ${email}`);
    } else if (user.provider !== 'google') {
      user = await this.updateUserToGoogle(user.id, providerId);
    }

    return user;
  }

  private async createGoogleUser(email: string, name: string, providerId: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        name,
        provider: 'google',
        providerId,
      },
    });
  }

  private async updateUserToGoogle(userId: string, providerId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        provider: 'google',
        providerId,
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
}
