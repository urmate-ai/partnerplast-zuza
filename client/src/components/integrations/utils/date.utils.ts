export function formatDateForDisplay(date: Date, isAllDay: boolean): string {
  if (isAllDay) {
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateForEvent(
  date: Date,
  isAllDay: boolean,
  timeZone: string,
): { dateTime?: string; date?: string; timeZone: string } {
  if (isAllDay) {
    return {
      date: date.toISOString().split('T')[0],
      timeZone,
    };
  }
  return {
    dateTime: date.toISOString(),
    timeZone,
  };
}

export function getDefaultEndDate(startDate: Date): Date {
  return new Date(startDate.getTime() + 3600000); // +1 hour
}

export function setToNow(date: Date, isAllDay: boolean): Date {
  const now = new Date();
  const newDate = new Date(date);
  newDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  if (!isAllDay) {
    newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
  }
  return newDate;
}

