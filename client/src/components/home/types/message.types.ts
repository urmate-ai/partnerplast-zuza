export type ProcessingStatus = 
  | 'transcribing'      
  | 'classifying'       
  | 'checking_email'    
  | 'checking_calendar' 
  | 'web_searching'     
  | 'preparing_response' 
  | null;                

export type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  status?: ProcessingStatus;
};

export type ChatMessagesProps = {
  messages: Message[];
  isTyping?: boolean;
  onTypingComplete?: () => void;
};

export type { Message as ChatMessage };

