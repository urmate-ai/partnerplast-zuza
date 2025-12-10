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
  async initiateAuth(
    @CurrentUser() user: CurrentUserPayload,
    @Query('expoRedirectUri') expoRedirectUri?: string,
  ) {
    const result = await this.gmailService.generateAuthUrl(
      user.id,
      expoRedirectUri,
    );
    return result;
  }

  @Get('callback')
  async handleCallback(@Query() query: GmailCallbackDto, @Res() res: Response) {
    if (query.gmail) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Gmail</title>
          </head>
          <body>
            <p>Przekierowanie do aplikacji...</p>
          </body>
        </html>
      `);
    }

    if (!query.code || !query.state) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Błąd</title>
          </head>
          <body>
            <p>Brak wymaganych parametrów OAuth (code, state)</p>
          </body>
        </html>
      `);
    }

    try {
      const { redirectUri } = await this.gmailService.handleCallback(
        query.code,
        query.state,
      );

      const deepLink = redirectUri
        ? `${redirectUri}?gmail=success`
        : 'urmate-ai-zuza://integrations?gmail=success';

      return res.redirect(302, deepLink);
    } catch (error) {
      console.error('Error in Gmail callback:', error);

      const errorDeepLink = 'urmate-ai-zuza://integrations?gmail=error';

      return res.redirect(302, errorDeepLink);
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

  @Get('search')
  @UseGuards(AuthGuard('jwt'))
  async searchMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Query('query') query?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    const max = maxResults ? parseInt(maxResults, 10) : 10;
    return this.gmailService.searchMessages(user.id, query, max);
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
