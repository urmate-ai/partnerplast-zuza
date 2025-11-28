import type { Multer } from 'multer';

export interface VoiceProcessOptions {
  language?: string;
  context?: string;
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

