import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import type { User } from '@prisma/client';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    provider: 'local',
    providerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    currentChatId: null,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    lastLogoutAt: null,
    pushNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokenResult', () => {
    it('powinien wygenerować token i zwrócić dane użytkownika', () => {
      const result = service.generateTokenResult(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        iat: expect.any(Number),
      });

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });

    it('powinien ustawić iat jako timestamp', () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      service.generateTokenResult(mockUser);
      const afterTime = Math.floor(Date.now() / 1000);

      const callArgs = (jwtService.sign as jest.Mock).mock.calls[0][0];
      expect(callArgs.iat).toBeGreaterThanOrEqual(beforeTime);
      expect(callArgs.iat).toBeLessThanOrEqual(afterTime);
    });
  });
});

