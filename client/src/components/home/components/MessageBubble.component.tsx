import React from 'react';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';
import type { Message, ProcessingStatus } from '../types/message.types';

interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
  displayedText?: string;
  typingMessageId?: string | null;
}

const getStatusStyle = (status: ProcessingStatus | undefined) => {
  if (!status) return null;
  
  // Statusy mają nieco inny styl - jaśniejsze tło, kursywa
  return {
    backgroundColor: '#E5E7EB', // bg-gray-200
    opacity: 0.9,
  };
};

export function MessageBubble({
  message,
  isTyping = false,
  displayedText,
  typingMessageId,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStatus = message.status !== null && message.status !== undefined;
  const isAnimating =
    !isUser &&
    !isStatus &&
    isTyping &&
    message.id === typingMessageId &&
    displayedText !== undefined;
  const messageContent = message.content || '';
  const displayContent = isAnimating ? displayedText : messageContent;
  const showCursor = isAnimating && displayedText && message.content
    ? displayedText.length < message.content.length
    : false;
  
  const statusStyle = getStatusStyle(message.status);

  return (
    <View
      className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gray-900 rounded-br-sm'
            : isStatus
            ? 'bg-gray-200 rounded-bl-sm'
            : 'bg-gray-100 rounded-bl-sm'
        }`}
        style={statusStyle || undefined}
      >
        <Text
          className={`text-base ${
            isUser 
              ? 'text-white' 
              : isStatus
              ? 'text-gray-600 italic'
              : 'text-gray-900'
          }`}
        >
          {displayContent}
          {showCursor && <Text className="opacity-50">▊</Text>}
        </Text>
      </View>
    </View>
  );
}

