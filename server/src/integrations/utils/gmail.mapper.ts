import type { gmail_v1 } from 'googleapis';
import type { GmailMessage } from '../types/gmail.types';

export class GmailMapper {
  static toMessageDto(message: gmail_v1.Schema$Message): GmailMessage {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string): string =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || '';

    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          const htmlBody = Buffer.from(part.body.data, 'base64').toString(
            'utf-8',
          );
          body = htmlBody
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
    }

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
      body: body || undefined,
      isUnread: message.labelIds?.includes('UNREAD') || false,
    };
  }
}
