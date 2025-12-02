export type EmailIntentResult = {
  shouldSendEmail: boolean;
  to?: string;
  subject?: string;
  body?: string;
};

export type CalendarIntentResult = {
  shouldCreateEvent: boolean;
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  isAllDay?: boolean;
  attendees?: string[];
};

export type SmsIntentResult = {
  shouldSendSms: boolean;
  to?: string;
  body?: string;
};

export type EmailIntentRaw = {
  shouldSendEmail?: boolean;
  to?: string | null;
  subject?: string | null;
  body?: string | null;
};

export type CalendarIntentRaw = {
  shouldCreateEvent?: boolean;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  isAllDay?: boolean;
  attendees?: Array<string | null> | null;
};

export type SmsIntentRaw = {
  shouldSendSms?: boolean;
  to?: string | null;
  body?: string | null;
};
