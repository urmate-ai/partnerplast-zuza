import type { CalendarEvent } from '../types/calendar.types';

export class CalendarFormatter {
  static formatForAiContext(
    events: CalendarEvent[],
    daysAhead: number,
  ): string {
    if (events.length === 0) {
      return `Brak wydarzeń w kalendarzu w najbliższych ${daysAhead} dniach.`;
    }

    const formattedEvents = events.map((event, index) => {
      const startDate = event.start.dateTime
        ? new Date(event.start.dateTime)
        : event.start.date
          ? new Date(event.start.date)
          : null;

      const endDate = event.end.dateTime
        ? new Date(event.end.dateTime)
        : event.end.date
          ? new Date(event.end.date)
          : null;

      const dateStr = startDate
        ? startDate.toLocaleString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour:
              startDate.getHours() !== 0 || startDate.getMinutes() !== 0
                ? '2-digit'
                : undefined,
            minute: startDate.getMinutes() !== 0 ? '2-digit' : undefined,
          })
        : 'Data nieznana';

      const timeStr =
        startDate && !event.isAllDay
          ? `${startDate.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            })} - ${endDate?.toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : event.isAllDay
            ? 'Cały dzień'
            : '';

      return `${index + 1}. ${event.summary}
   Data: ${dateStr}${timeStr ? `\n   Godzina: ${timeStr}` : ''}${event.location ? `\n   Miejsce: ${event.location}` : ''}${event.description ? `\n   Opis: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}` : ''}`;
    });

    return `Nadchodzące wydarzenia w kalendarzu (${events.length}):\n\n${formattedEvents.join('\n\n')}`;
  }
}
