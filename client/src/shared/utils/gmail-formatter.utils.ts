import type { GmailMessage } from '../../services/gmail.service';

export class GmailFormatter {
  static formatForAiContext(messages: GmailMessage[]): string {
    if (messages.length === 0) {
      return 'Brak wiadomości email w skrzynce odbiorczej.';
    }

    const formattedMessages = messages.map((msg, index) => {
      const dateStr = new Date(msg.date).toLocaleString('pl-PL');
      const unreadFlag = msg.isUnread ? '[NIEPRZECZYTANA] ' : '';
      return `${index + 1}. ${unreadFlag}Od: ${msg.from}
Temat: ${msg.subject}
Data: ${dateStr}
Podgląd: ${msg.snippet}`;
    });

    return `Ostatnie wiadomości email użytkownika (${messages.length}):\n\n${formattedMessages.join('\n\n')}`;
  }
}
