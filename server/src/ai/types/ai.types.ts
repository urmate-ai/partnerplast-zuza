import type { Multer } from 'multer';

export type VoiceProcessOptions = {
  language?: string;
  context?: string;
  location?: string;
};

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

export type ChatHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
};

export type ChatWithMessages = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};

export type AudioFile = Multer.File;

export type OpenAIConfig = {
  model: string;
  maxTokens?: number;
  temperature: number;
};

export type WebSearchTool = {
  type: 'web_search';
};

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

export type ResponsesCreateParams = {
  model: string;
  input: string;
  tools?: WebSearchTool[];
  reasoning?: {
    effort: ReasoningEffort;
  };
  max_output_tokens?: number;
};

export type OpenAITextBlock = {
  type: 'output_text';
  text: string | { value: string };
};

export type OpenAIMessageLike = {
  content?: string;
};

export type OpenAIResponseVariant = {
  content?: OpenAITextBlock[];
  message?: OpenAIMessageLike;
};

export type OpenAIResponsePayload = {
  output_text?: string;
  output?: OpenAIResponseVariant[];
  choices?: OpenAIResponseVariant[];
  status?: string;
  incomplete_details?: {
    reason?: string;
  };
};

export type OpenAIResponsesClient = {
  create(params: ResponsesCreateParams): Promise<OpenAIResponsePayload>;
};
