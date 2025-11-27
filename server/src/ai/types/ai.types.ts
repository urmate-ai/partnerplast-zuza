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

export type AudioFile = Multer.File;

