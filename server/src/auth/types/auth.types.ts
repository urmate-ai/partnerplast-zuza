import { User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  provider: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithLogout extends User {
  lastLogoutAt: Date | null;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface UpdateNotificationsData {
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  soundEnabled?: boolean;
}

export type UserWithPassword = User & { password: string };
