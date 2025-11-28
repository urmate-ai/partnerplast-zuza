import { Injectable } from '@nestjs/common';
import { LocalAuthService } from './services/local-auth.service';
import { OAuthService } from './services/oauth.service';
import { UserService } from './services/user.service';
import type {
  JwtPayload,
  UpdateProfileData,
  UpdateNotificationsData,
} from './types/auth.types';
import type { GoogleProfile } from './types/oauth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly localAuthService: LocalAuthService,
    private readonly oauthService: OAuthService,
    private readonly userService: UserService,
  ) {}

  async register(name: string, email: string, password: string) {
    return this.localAuthService.register(name, email, password);
  }

  async login(email: string, password: string) {
    return this.localAuthService.login(email, password);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.localAuthService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  async validateGoogleUser(profile: GoogleProfile) {
    return this.oauthService.validateGoogleUser(profile);
  }

  async validateUser(payload: JwtPayload) {
    return this.userService.validateUser(payload);
  }

  async getProfile(userId: string) {
    return this.userService.getProfile(userId);
  }

  async updateProfile(userId: string, updateData: UpdateProfileData) {
    return this.userService.updateProfile(userId, updateData);
  }

  async updateNotifications(
    userId: string,
    updateData: UpdateNotificationsData,
  ) {
    return this.userService.updateNotifications(userId, updateData);
  }

  async logout(userId: string) {
    return this.userService.logout(userId);
  }

  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  async forgotPassword(email: string) {
    return this.localAuthService.forgotPassword(email);
  }

  async resetPassword(token: string, newPassword: string) {
    return this.localAuthService.resetPassword(token, newPassword);
  }

  async verifyGoogleToken(accessToken: string) {
    return this.oauthService.verifyGoogleToken(accessToken);
  }

  async deleteAccount(userId: string) {
    return this.userService.deleteAccount(userId);
  }
}
