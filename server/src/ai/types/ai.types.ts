export type ChatHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
};

export type AudioFile = {
  id: string;
  url: string;
  createdAt: Date;
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
