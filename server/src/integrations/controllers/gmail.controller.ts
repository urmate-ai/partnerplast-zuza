import {
  Controller,
  Get,
  Delete,
  Post,
  Query,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { GmailService } from '../services/gmail/gmail.service';
import { GmailCallbackDto, GmailSendMessageDto } from '../dto/gmail.dto';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../../auth/decorators/current-user.decorator';

@Controller('integrations/gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('auth')
  @UseGuards(AuthGuard('jwt'))
  initiateAuth(
    @CurrentUser() user: CurrentUserPayload,
    @Query('expoRedirectUri') expoRedirectUri?: string,
  ) {
    const result = this.gmailService.generateAuthUrl(user.id, expoRedirectUri);
    return result;
  }

  @Get('callback')
  async handleCallback(@Query() query: GmailCallbackDto, @Res() res: Response) {
    try {
      await this.gmailService.handleCallback(query.code, query.state);

      const deepLink = 'exp://192.168.0.23:8081/--/integrations?gmail=success';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
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
                background: white;
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 16px;
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
                color: #000000;
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
                background: #000000;
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 18px;
                transition: all 0.3s ease;
              }
              .button:hover {
                background: #333333;
                transform: translateY(-2px);
              }
              .button:active {
                transform: translateY(0);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✓</div>
              <h1>Gmail połączony!</h1>
              <p>Kliknij poniższy przycisk, aby wrócić do aplikacji</p>
              <a href="${deepLink}" class="button" id="returnButton">Wróć do aplikacji</a>
            </div>
            <script>
              (function() {
                const deepLink = '${deepLink}';
                
                // Metoda 1: Natychmiastowe przekierowanie (najlepsze dla Safari)
                try {
                  window.location.replace(deepLink);
                } catch (e) {
                  console.error('location.replace failed:', e);
                }
                
                // Metoda 2: Fallback - automatyczne kliknięcie
              window.addEventListener('load', function() {
                setTimeout(function() {
                  const button = document.getElementById('returnButton');
                  if (button) {
                    button.click();
                    }
                  }, 100);
                });
                
                // Metoda 3: Dodatkowy fallback przez location.href
                setTimeout(function() {
                  try {
                    window.location.href = deepLink;
                  } catch (e) {
                    console.error('location.href failed:', e);
                  }
                }, 500);
              })();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Gmail callback:', error);

      const deepLink = 'exp://192.168.0.23:8081/--/integrations?gmail=error';

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
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
                background: white;
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 16px;
                max-width: 400px;
                width: 90%;
              }
              .icon {
                font-size: 64px;
                margin-bottom: 20px;
              }
              h1 {
                color: #000000;
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
                background: #000000;
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 18px;
                transition: all 0.3s ease;
              }
              .button:hover {
                background: #333333;
                transform: translateY(-2px);
              }
              .button:active {
                transform: translateY(0);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✗</div>
              <h1>Błąd połączenia</h1>
              <p>Wystąpił błąd podczas łączenia z Gmail. Kliknij poniższy przycisk, aby wrócić do aplikacji</p>
              <a href="${deepLink}" class="button" id="returnButton">Wróć do aplikacji</a>
            </div>
            <script>
              (function() {
                const deepLink = '${deepLink}';
                
                // Metoda 1: Natychmiastowe przekierowanie (najlepsze dla Safari)
                try {
                  window.location.replace(deepLink);
                } catch (e) {
                  console.error('location.replace failed:', e);
                }
                
                // Metoda 2: Fallback - automatyczne kliknięcie
              window.addEventListener('load', function() {
                setTimeout(function() {
                  const button = document.getElementById('returnButton');
                  if (button) {
                    button.click();
                    }
                  }, 100);
                });
                
                // Metoda 3: Dodatkowy fallback przez location.href
                setTimeout(function() {
                  try {
                    window.location.href = deepLink;
                  } catch (e) {
                    console.error('location.href failed:', e);
                  }
                }, 500);
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

  @Post('send')
  @UseGuards(AuthGuard('jwt'))
  async sendEmail(
    @CurrentUser() user: CurrentUserPayload,
    @Body() sendMessageDto: GmailSendMessageDto,
  ) {
    return this.gmailService.sendEmail(
      user.id,
      sendMessageDto.to,
      sendMessageDto.subject,
      sendMessageDto.body,
      sendMessageDto.cc,
      sendMessageDto.bcc,
    );
  }

  @Get('context')
  @UseGuards(AuthGuard('jwt'))
  async getContextForAi(
    @CurrentUser() user: CurrentUserPayload,
    @Query('maxResults') maxResults?: string,
  ) {
    const max = maxResults ? parseInt(maxResults, 10) : 20;
    const context = await this.gmailService.getMessagesForAiContext(
      user.id,
      max,
    );
    return { context };
  }
}
