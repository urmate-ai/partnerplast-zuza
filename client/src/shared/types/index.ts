export type VoiceAiResponse = {
  transcript: string;
  reply: string;
};

export type ChatHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
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

