import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Res,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleVerifyDto } from './dto/google-verify.dto';
import {
  CurrentUser,
  type CurrentUserPayload,
} from './decorators/current-user.decorator';
import type { ExpressResponse } from '../common/types/express.types';
import type { GoogleAuthResult } from './types/oauth.types';

type AuthSession = {
  accessToken: string;
  user: unknown;
  expiresAt: number;
};

declare global {
  var authSessions: Map<string, AuthSession> | undefined;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.id);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(
    @Request() req: { user?: GoogleAuthResult },
    @Res() res: ExpressResponse,
    @Query('state') state?: string,
  ) {
    try {
      const redirectUri = state || 'urmate-ai-zuza://auth/google/callback';

      if (!req.user) {
        const errorUrl = `${redirectUri}?error=authentication_failed`;
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Błąd logowania</title>
            </head>
            <body>
              <script>
                const url = '${errorUrl}';
                window.location.href = url;
                setTimeout(function() {
                  const link = document.createElement('a');
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                }, 100);
              </script>
              <p>Błąd logowania. Przekierowywanie...</p>
              <p><a href="${errorUrl}">Kliknij tutaj jeśli przekierowanie nie działa</a></p>
            </body>
          </html>
        `);
      }

      const { accessToken, user: userData } = req.user;

      const sessionCode = Buffer.from(
        `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      )
        .toString('base64')
        .substring(0, 32);

      if (!global.authSessions) {
        global.authSessions = new Map();
      }
      global.authSessions.set(sessionCode, {
        accessToken,
        user: userData,
        expiresAt: Date.now() + 2 * 60 * 1000,
      });

      for (const [code, session] of global.authSessions.entries()) {
        if (session.expiresAt < Date.now()) {
          global.authSessions.delete(code);
        }
      }

      const redirectUrl = `${redirectUri}?code=${sessionCode}`;

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Logowanie zakończone</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                max-width: 400px;
                width: 90%;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
                animation: bounce 0.6s ease-in-out;
              }
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              h1 {
                color: #10b981;
                font-size: 24px;
                margin: 0 0 10px 0;
              }
              p {
                color: #6b7280;
                font-size: 16px;
                margin: 0 0 30px 0;
              }
              .button {
                display: inline-block;
                width: 100%;
                padding: 16px 32px;
                background: #10b981;
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 18px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
              }
              .button:hover {
                background: #059669;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
              }
              .button:active {
                transform: translateY(0);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✓</div>
              <h1>Zalogowano!</h1>
              <p>Kliknij poniższy przycisk, aby wrócić do aplikacji</p>
              <a href="${redirectUrl}" class="button" id="returnButton">Wróć do aplikacji</a>
            </div>
            <script>
              // Automatyczne kliknięcie po załadowaniu
              window.addEventListener('load', function() {
                setTimeout(function() {
                  const button = document.getElementById('returnButton');
                  if (button) {
                    button.click();
                  }
                }, 500);
              });
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google callback error:', error);
      const redirectUri = state || 'urmate-ai-zuza://auth/google/callback';
      const errorUrl = `${redirectUri}?error=callback_failed`;
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Błąd logowania</title>
          </head>
          <body>
            <script>
              window.location.href = '${errorUrl}';
              setTimeout(function() {
                window.close();
              }, 1000);
            </script>
            <p>Wystąpił błąd. Zamykanie okna...</p>
          </body>
        </html>
      `);
    }
  }

  @Post('google/verify')
  @HttpCode(HttpStatus.OK)
  async googleVerify(@Body() dto: GoogleVerifyDto) {
    return this.authService.verifyGoogleToken(dto.accessToken);
  }

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  googleExchangeCode(@Body() body: { code: string }) {
    if (!global.authSessions) {
      throw new Error('Invalid session code');
    }

    const session = global.authSessions.get(body.code);

    if (!session) {
      throw new Error('Invalid or expired session code');
    }

    if (session.expiresAt < Date.now()) {
      global.authSessions.delete(body.code);
      throw new Error('Session code expired');
    }

    global.authSessions.delete(body.code);

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logout(user.id);
  }

  @Put('notifications')
  @UseGuards(AuthGuard('jwt'))
  async updateNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateNotificationsDto,
  ) {
    return this.authService.updateNotifications(user.id, dto);
  }

  @Get('users')
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Delete('account')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.deleteAccount(user.id);
  }
}
