import type {
  EmailIntentResult,
  EmailIntentRaw,
  CalendarIntentResult,
  CalendarIntentRaw,
  SmsIntentResult,
  SmsIntentRaw,
} from '../types/intent.types';

export class IntentParser {
  private static readonly NULL_VALUES = ['null', null, undefined];

  static parseEmailIntent(raw: EmailIntentRaw): EmailIntentResult {
    return {
      shouldSendEmail: raw.shouldSendEmail === true,
      to: this.parseStringField(raw.to),
      subject: this.parseStringField(raw.subject),
      body: this.parseStringField(raw.body),
    };
  }

  static parseCalendarIntent(raw: CalendarIntentRaw): CalendarIntentResult {
    return {
      shouldCreateEvent: raw.shouldCreateEvent === true,
      summary: this.parseStringField(raw.summary),
      description: this.parseStringField(raw.description),
      location: this.parseStringField(raw.location),
      startDateTime: this.parseStringField(raw.startDateTime),
      endDateTime: this.parseStringField(raw.endDateTime),
      isAllDay: raw.isAllDay === true,
      attendees: this.parseAttendees(raw.attendees),
    };
  }

  static parseSmsIntent(raw: SmsIntentRaw): SmsIntentResult {
    return {
      shouldSendSms: raw.shouldSendSms === true,
      to: this.parseStringField(raw.to),
      body: this.parseStringField(raw.body),
    };
  }

  private static parseStringField(
    value: string | null | undefined,
  ): string | undefined {
    if (!value || this.NULL_VALUES.includes(value)) {
      return undefined;
    }
    return String(value);
  }

  private static parseAttendees(
    attendees: Array<string | null> | null | undefined,
  ): string[] | undefined {
    if (!attendees || !Array.isArray(attendees)) {
      return undefined;
    }

    const parsed = attendees
      .filter((a): a is string => a !== null && !this.NULL_VALUES.includes(a))
      .map(String);

    return parsed.length > 0 ? parsed : undefined;
  }
}
