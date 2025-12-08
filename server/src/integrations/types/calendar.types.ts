export type CalendarOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type CalendarTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
};

export type CalendarUserInfo = {
  email: string;
  name?: string;
  timezone?: string;
};

export type CalendarAuthUrlResponse = {
  authUrl: string;
  state: string;
};

export type CalendarConnectionStatus = {
  isConnected: boolean;
  email?: string;
  connectedAt?: Date;
  scopes?: string[];
  timezone?: string;
};

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  recurringEventId?: string;
  isAllDay?: boolean;
};

export type CalendarList = {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
  foregroundColor?: string;
};

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
] as const;

export type CalendarScope = (typeof CALENDAR_SCOPES)[number];
