export class DateUtils {
  static formatRelativeTimestamp(date: Date | string): string {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Teraz';
    } else if (diffHours < 24) {
      return 'Dzisiaj';
    } else if (diffDays === 1) {
      return 'Wczoraj';
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 'Tydzień temu' : `${weeks} tygodnie temu`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? 'Miesiąc temu' : `${months} miesiące temu`;
    }
  }

  static addHours(hours: number): Date {
    return new Date(Date.now() + hours * 3600000);
  }
}

