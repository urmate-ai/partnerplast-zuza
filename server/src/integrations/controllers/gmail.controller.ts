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
            <title>Gmail połączony</title>
          </head>
          <body>
            <script>
              function openDeepLink() {
                const url = '${deepLink}';
                
                try {
                  window.location.href = url;
                } catch (e) {
                  console.error('window.location failed:', e);
                }
                
                setTimeout(function() {
                  try {
                    window.open(url, '_self');
                  } catch (e) {
                    console.error('window.open failed:', e);
                  }
                }, 100);
                
                setTimeout(function() {
                  const link = document.createElement('a');
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }, 200);
              }
              
              openDeepLink();
              
              setTimeout(function() {
                try {
                  window.close();
                } catch (e) { 
                  console.error('window.close failed:', e);
                }
              }, 2000);
            </script>
            <p style="text-align: center; padding: 20px; font-family: system-ui;">
              Gmail został pomyślnie połączony! Przekierowywanie do aplikacji...
            </p>
            <p style="text-align: center;">
              <a href="${deepLink}" style="color: #2563EB;">Kliknij tutaj jeśli przekierowanie nie działa</a>
            </p>
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
            <title>Błąd połączenia Gmail</title>
          </head>
          <body>
            <script>
              const url = '${deepLink}';
              window.location.href = url;
              setTimeout(function() {
                const link = document.createElement('a');
                link.href = url;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
              }, 100);
            </script>
            <p style="text-align: center; padding: 20px; font-family: system-ui; color: #DC2626;">
              Wystąpił błąd podczas łączenia z Gmail. Przekierowywanie do aplikacji...
            </p>
            <p style="text-align: center;">
              <a href="${deepLink}" style="color: #2563EB;">Kliknij tutaj jeśli przekierowanie nie działa</a>
            </p>
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
