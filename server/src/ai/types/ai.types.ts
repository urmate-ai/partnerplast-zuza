import type { Multer } from 'multer';

export interface VoiceProcessOptions {
  language?: string;
  context?: string;
  location?: string;
}

export interface VoiceProcessResult {
  transcript: string;
  reply: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ChatWithMessages {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type AudioFile = Multer.File;

export interface OpenAIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

export type WebSearchTool = {
  type: 'web_search';
};

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

export interface ResponsesCreateParams {
  model: string;
  input: string;
  tools?: WebSearchTool[];
  reasoning?: {
    effort: ReasoningEffort;
  };
}

export interface OpenAITextBlock {
  type: 'output_text';
  text: string | { value: string };
}

export interface OpenAIMessageLike {
  content?: string;
}

export interface OpenAIResponseVariant {
  content?: OpenAITextBlock[];
  message?: OpenAIMessageLike;
}

export interface OpenAIResponsePayload {
  output_text?: string;
  output?: OpenAIResponseVariant[];
  choices?: OpenAIResponseVariant[];
  status?: string;
  incomplete_details?: {
    reason?: string;
  };
}

export interface OpenAIResponsesClient {
  create(params: ResponsesCreateParams): Promise<OpenAIResponsePayload>;
}
