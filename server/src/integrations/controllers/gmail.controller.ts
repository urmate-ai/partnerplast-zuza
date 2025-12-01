import { Controller, Get, Delete, Query, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { GmailService } from '../services/gmail.service';
import { GmailCallbackDto } from '../dto/gmail.dto';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../auth/decorators/current-user.decorator';

@Controller('integrations/gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('auth')
  @UseGuards(AuthGuard('jwt'))
  initiateAuth(@CurrentUser() user: CurrentUserPayload) {
    const { authUrl } = this.gmailService.generateAuthUrl(user.id);
    return { authUrl };
  }

  @Get('callback')
  async handleCallback(@Query() query: GmailCallbackDto, @Res() res: Response) {
    try {
      await this.gmailService.handleCallback(query.code, query.state);

      const deepLink = 'urmate-ai-zuza://integrations?gmail=success';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="0;url=${deepLink}">
            <title>Gmail połączony</title>
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
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .link {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #2563EB;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
              }
              .link:hover {
                background: #1d4ed8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #10b981; margin-bottom: 10px;">✓</h1>
              <p style="font-size: 18px; margin-bottom: 10px;">Gmail został pomyślnie połączony!</p>
              <p style="color: #6b7280; margin-bottom: 20px;">Przekierowywanie do aplikacji...</p>
              <a href="${deepLink}" class="link">Otwórz aplikację</a>
            </div>
            <script>
              (function() {
                const url = '${deepLink}';
                
                // Metoda 1: Natychmiastowe przekierowanie przez location.replace (działa lepiej w Safari)
                try {
                  window.location.replace(url);
                } catch (e) {
                  console.error('location.replace failed:', e);
                }
                
                // Metoda 2: Fallback - kliknięcie w link (działa w większości przypadków)
                setTimeout(function() {
                  const link = document.createElement('a');
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  try {
                    link.click();
                  } catch (e) {
                    console.error('link.click failed:', e);
                  }
                  setTimeout(function() {
                    document.body.removeChild(link);
                  }, 100);
                }, 100);
                
                // Metoda 3: Ostatnia próba przez window.location.href
                setTimeout(function() {
                  try {
                    window.location.href = url;
                  } catch (e) {
                    console.error('location.href failed:', e);
                  }
                }, 300);
              })();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Gmail callback:', error);

      const deepLink = 'urmate-ai-zuza://integrations?gmail=error';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="0;url=${deepLink}">
            <title>Błąd połączenia Gmail</title>
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
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .link {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #2563EB;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
              }
              .link:hover {
                background: #1d4ed8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 style="color: #DC2626; margin-bottom: 10px;">✗</h1>
              <p style="font-size: 18px; margin-bottom: 10px; color: #DC2626;">Wystąpił błąd podczas łączenia z Gmail</p>
              <p style="color: #6b7280; margin-bottom: 20px;">Przekierowywanie do aplikacji...</p>
              <a href="${deepLink}" class="link">Otwórz aplikację</a>
            </div>
            <script>
              (function() {
                const url = '${deepLink}';
                
                // Metoda 1: Natychmiastowe przekierowanie przez location.replace
                try {
                  window.location.replace(url);
                } catch (e) {
                  console.error('location.replace failed:', e);
                }
                
                // Metoda 2: Fallback - kliknięcie w link
                setTimeout(function() {
                  const link = document.createElement('a');
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  try {
                    link.click();
                  } catch (e) {
                    console.error('link.click failed:', e);
                  }
                  setTimeout(function() {
                    document.body.removeChild(link);
                  }, 100);
                }, 100);
                
                // Metoda 3: Ostatnia próba przez window.location.href
                setTimeout(function() {
                  try {
                    window.location.href = url;
                  } catch (e) {
                    console.error('location.href failed:', e);
                  }
                }, 300);
              })();
            </script>
          </body>
        </html>
      `);
    }
  }

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async getStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.gmailService.getConnectionStatus(user.id);
  }

  @Delete('disconnect')
  @UseGuards(AuthGuard('jwt'))
  async disconnect(@CurrentUser() user: CurrentUserPayload) {
    await this.gmailService.disconnectGmail(user.id);
    return { message: 'Gmail disconnected successfully' };
  }

  @Get('messages')
  @UseGuards(AuthGuard('jwt'))
  async getMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Query('maxResults') maxResults?: string,
  ) {
    const max = maxResults ? parseInt(maxResults, 10) : 10;
    return this.gmailService.getRecentMessages(user.id, max);
  }
}
