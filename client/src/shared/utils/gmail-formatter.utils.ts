import type { GmailMessage } from '../../services/gmail.service';

export class GmailFormatter {
  static formatForAiContext(messages: GmailMessage[]): string {
    if (messages.length === 0) {
      return 'Brak wiadomości email w skrzynce odbiorczej.';
    }

    const formattedMessages = messages.map((msg, index) => {
      const date = new Date(msg.date);
      const daysOfWeek = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
      const dayOfWeek = daysOfWeek[date.getDay()];
      
      const dateStr = date.toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hour}:${minute}`;
      
      const fullDateStr = `${dayOfWeek}, ${dateStr}`;
      
      const unreadFlag = msg.isUnread ? '[NIEPRZECZYTANA] ' : '';
      const bodyPreview = msg.body 
        ? `\nTreść: ${msg.body.substring(0, 500)}${msg.body.length > 500 ? '...' : ''}`
        : '';
      
      return `${index + 1}. ${unreadFlag}Od: ${msg.from}
Temat: ${msg.subject}
Data: ${fullDateStr} (godzina: ${timeStr})
Podgląd: ${msg.snippet}${bodyPreview}`;
    });

    return `Ostatnie wiadomości email użytkownika (${messages.length}):\n\n${formattedMessages.join('\n\n')}`;
  }
}
