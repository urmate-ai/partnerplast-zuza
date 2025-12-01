export type ChatRole = 'user' | 'assistant';

export type MessageRole = ChatRole | 'system';

export type ChatMessageInput = {
  role: ChatRole;
  content: string;
};

export type ChatMessageHistory = {
  role: ChatRole;
  content: string;
};

export type PrismaChatWithMessages = {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }>;
};

export type PrismaChatHistoryItem = {
  id: string;
  title: string | null;
  updatedAt: Date;
};
