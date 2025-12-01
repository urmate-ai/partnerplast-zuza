import { DateUtils } from '../../common/utils/date.utils';
import type {
  ChatHistoryItem,
  ChatWithMessages,
  ChatMessage,
} from '../types/ai.types';
import type {
  PrismaChatWithMessages,
  PrismaChatHistoryItem,
  ChatRole,
} from '../types/chat.types';

export class ChatMapper {
  static toDto(chat: PrismaChatWithMessages): ChatWithMessages {
    return {
      id: chat.id,
      title: chat.title ?? 'Bez tytułu',
      messages: chat.messages.map((msg) => this.mapMessage(msg)),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }

  static toHistoryItem(chat: PrismaChatHistoryItem): ChatHistoryItem {
    return {
      id: chat.id,
      title: chat.title ?? 'Bez tytułu',
      timestamp: DateUtils.formatRelativeTimestamp(chat.updatedAt),
    };
  }

  private static mapMessage(msg: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }): ChatMessage {
    return {
      id: msg.id,
      role: this.validateRole(msg.role),
      content: msg.content,
      createdAt: msg.createdAt,
    };
  }

  private static validateRole(role: string): ChatRole {
    if (role === 'user' || role === 'assistant') {
      return role;
    }
    return 'user';
  }
}
