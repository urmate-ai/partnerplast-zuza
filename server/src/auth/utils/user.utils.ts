import type { User } from '@prisma/client';

export class UserUtils {
  static isLocalUser(user: User | null): boolean {
    return user?.provider === 'local' && !!user?.password;
  }

  static isOAuthUser(user: User | null): boolean {
    return user?.provider !== 'local';
  }

  static extractEmailFromGoogleProfile(emails: Array<{ value: string }> | undefined): string | null {
    return emails?.[0]?.value ?? null;
  }
}

