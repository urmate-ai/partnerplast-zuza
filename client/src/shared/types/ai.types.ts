export type EmailIntent = {
  shouldSendEmail: boolean;
  to?: string;
  subject?: string;
  body?: string;
  cc?: string[];
  bcc?: string[];
};

export type CalendarIntent = {
  shouldCreateEvent: boolean;
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  isAllDay?: boolean;
  attendees?: string[];
};

export type SmsIntent = {
  shouldSendSms: boolean;
  to?: string;
  body?: string;
};

export type VoiceProcessResult = {
  transcript: string;
  reply: string;
  emailIntent?: EmailIntent;
  calendarIntent?: CalendarIntent;
  smsIntent?: SmsIntent;
};

