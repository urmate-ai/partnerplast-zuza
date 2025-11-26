import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export type User = {
  id: string;
  email: string;
  name: string;
  password?: string;
  provider?: 'local' | 'google' | 'apple';
  providerId?: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private users: Map<string, User> = new Map();
  private userIdCounter = 1;

  constructor(private readonly jwtService: JwtService) {
    this.createTestUser();
  }

  private createTestUser() {
    const testUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      password: bcrypt.hashSync('password123', 10),
      provider: 'local',
    };
    this.users.set(testUser.email, testUser);
    this.logger.log('Test user created: test@example.com / password123');
  }

  async register(name: string, email: string, password: string) {
    if (this.users.has(email)) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: String(this.userIdCounter++),
      email,
      name,
      password: hashedPassword,
      provider: 'local',
    };

    this.users.set(email, user);
    this.logger.log(`User registered: ${email}`);

    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = this.users.get(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${email}`);
    return this.generateTokens(user);
  }

  async validateGoogleUser(profile: any) {
    const email = profile.emails[0].value;
    let user = this.users.get(email);

    if (!user) {
      user = {
        id: String(this.userIdCounter++),
        email,
        name: profile.displayName,
        provider: 'google',
        providerId: profile.id,
      };
      this.users.set(email, user);
      this.logger.log(`New Google user created: ${email}`);
    }

    return this.generateTokens(user);
  }

  async validateAppleUser(profile: any) {
    const email = profile.email;
    let user = this.users.get(email);

    if (!user) {
      user = {
        id: String(this.userIdCounter++),
        email,
        name: profile.name || 'Apple User',
        provider: 'apple',
        providerId: profile.sub,
      };
      this.users.set(email, user);
      this.logger.log(`New Apple user created: ${email}`);
    }

    return this.generateTokens(user);
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = this.users.get(payload.email);
    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  private generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
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

  getAllUsers() {
    return Array.from(this.users.values()).map(({ password, ...user }) => user);
  }
}

