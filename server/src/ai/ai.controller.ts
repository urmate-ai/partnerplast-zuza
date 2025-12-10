import {
  Controller,
  Get,
  Post,
  Delete,
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
  async getChatHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : undefined;
    return this.chatService.getChatHistory(user.id, limitNumber);
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

  @Post('chats/save')
  @UseGuards(AuthGuard('jwt'))
  async saveChat(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { transcript: string; reply: string },
  ) {
    await this.chatService.saveChat(user.id, body.transcript, body.reply);
    return { success: true };
  }

  @Get('chats/current')
  @UseGuards(AuthGuard('jwt'))
  async getOrCreateCurrentChat(@CurrentUser() user: CurrentUserPayload) {
    const chatId = await this.chatService.getOrCreateCurrentChat(user.id);
    return { chatId };
  }

  @Delete('chats/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteChat(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') chatId: string,
  ) {
    await this.chatService.deleteChat(chatId, user.id);
    return { success: true };
  }
}
