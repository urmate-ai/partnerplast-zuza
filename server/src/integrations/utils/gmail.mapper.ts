import type { gmail_v1 } from 'googleapis';
import type { GmailMessage } from '../types/gmail.types';

export class GmailMapper {
  static toMessageDto(message: gmail_v1.Schema$Message): GmailMessage {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string): string =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || '';

    return {
      id: message.id || '',
      threadId: message.threadId || '',
      subject: getHeader('subject'),
      from: getHeader('from'),
      to: getHeader('to')
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0),
      date: new Date(parseInt(message.internalDate || '0')),
      snippet: message.snippet || '',
      isUnread: message.labelIds?.includes('UNREAD') || false,
    };
  }
}
