export type ProcessingStatus = 
  | 'transcribing'      
  | 'classifying'       
  | 'checking_email'    
  | 'checking_calendar' 
  | 'checking_contacts'
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
  bottomControlsHeight?: number;
};

export type { Message as ChatMessage };

