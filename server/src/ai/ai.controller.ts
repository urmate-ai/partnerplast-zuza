import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './services/chat/chat.service';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/decorators/current-user.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly chatService: ChatService) {}

  @Get('chat-history')
  @UseGuards(AuthGuard('jwt'))
  async getChatHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.chatService.getChatHistory(user.id);
  }

  @Get('chats')
  @UseGuards(AuthGuard('jwt'))
  async searchChats(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
  ) {
    if (search && search.trim()) {
      return this.chatService.searchChats(user.id, search.trim());
    }
    return this.chatService.getChatHistory(user.id);
  }

  @Get('chats/:id')
  @UseGuards(AuthGuard('jwt'))
  async getChatById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') chatId: string,
  ) {
    return this.chatService.getChatById(chatId, user.id);
  }

  @Post('chats/new')
  @UseGuards(AuthGuard('jwt'))
  async createNewChat(@CurrentUser() user: CurrentUserPayload) {
    const chatId = await this.chatService.createNewChat(user.id);
    return { chatId };
  }

  @Post('chats/:id/messages')
  @UseGuards(AuthGuard('jwt'))
  async addMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') chatId: string,
    @Body() body: { role: 'user' | 'assistant'; content: string },
  ) {
    await this.chatService.getChatById(chatId, user.id);
    await this.chatService.addMessage(chatId, body.role, body.content);
    return { success: true };
  }
}
