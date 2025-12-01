import type { EmailIntent } from './ai.types';

export type VoiceAiResponse = {
  transcript: string;
  reply: string;
  emailIntent?: EmailIntent;
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
  createdAt: string;
};

export type ChatWithMessages = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

