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
      const redirectUrl = `${redirectUri}?token=${encodeURIComponent(accessToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`;

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Logowanie zakończone</title>
          </head>
          <body>
            <script>
              // Próbuj różne metody otwarcia deep linka
              function openDeepLink() {
                const url = '${redirectUrl}';
                
                // Metoda 1: window.location
                try {
                  window.location.href = url;
                } catch (e) {
                  console.error('window.location failed:', e);
                }
                
                // Metoda 2: window.open (fallback)
                setTimeout(function() {
                  try {
                    window.open(url, '_self');
                  } catch (e) {
                    console.error('window.open failed:', e);
                  }
                }, 100);
                
                // Metoda 3: Kliknięcie w link (fallback)
                setTimeout(function() {
                  const link = document.createElement('a');
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }, 200);
              }
              
              // Uruchom natychmiast
              openDeepLink();
              
              // Próbuj zamknąć okno po 2 sekundach
              setTimeout(function() {
                try {
                  window.close();
                } catch (e) {
                  // Nie można zamknąć okna (normalne w niektórych przeglądarkach)
                }
              }, 2000);
            </script>
            <p>Logowanie zakończone. Przekierowywanie do aplikacji...</p>
            <p><a href="${redirectUrl}">Kliknij tutaj jeśli przekierowanie nie działa</a></p>
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
