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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      res.redirect(`${frontendUrl}/integrations?gmail=success`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8081';
      console.error('Error in Gmail callback:', error);
      res.redirect(`${frontendUrl}/integrations?gmail=error`);
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
