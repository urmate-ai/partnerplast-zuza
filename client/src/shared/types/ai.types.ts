export type EmailIntent = {
  shouldSendEmail: boolean;
  to?: string;
  subject?: string;
  body?: string;
  cc?: string[];
  bcc?: string[];
};

export type VoiceProcessResult = {
  transcript: string;
  reply: string;
  emailIntent?: EmailIntent;
};

