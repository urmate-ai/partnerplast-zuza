export type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

export type ChatMessagesProps = {
  messages: Message[];
  isTyping?: boolean;
  onTypingComplete?: () => void;
};

export type { Message as ChatMessage };

