import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../../ai/services/chat.service';
import { OAuth2Client } from 'google-auth-library';
import { User } from '@prisma/client';
import type { GoogleProfile, GoogleAuthResult } from '../types/oauth.types';
import type { JwtPayload } from '../types/auth.types';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    this.googleClient = new OAuth2Client(clientId);
  }

  async validateGoogleUser(profile: GoogleProfile): Promise<GoogleAuthResult> {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new Error('Email not found in Google profile');
    }

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

    try {
      await this.chatService.createNewChat(user.id);
    } catch (error) {
      this.logger.warn(`Failed to create new chat for user ${user.id}, but login succeeded:`, error);
    }

    return this.generateTokens(user);
  }

  async verifyGoogleToken(accessToken: string): Promise<GoogleAuthResult> {
    try {
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

      let user = await this.prisma.user.findUnique({
        where: { email: userInfo.email },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.name || userInfo.email,
            provider: 'google',
            providerId: userInfo.sub,
          },
        });
        this.logger.log(`New Google user created: ${userInfo.email}`);
      } else if (user.provider !== 'google') {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerId: userInfo.sub,
          },
        });
      }

      try {
        await this.chatService.createNewChat(user.id);
      } catch (error) {
        this.logger.warn(`Failed to create new chat for user ${user.id}, but login succeeded:`, error);
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error('Google token verification failed:', error);
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  private generateTokens(user: User): GoogleAuthResult {
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

