import React from 'react';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';
import type { Message } from '../types/message.types';

interface MessageBubbleProps {
  message: Message;
  isTyping?: boolean;
  displayedText?: string;
  typingMessageId?: string | null;
}

export function MessageBubble({
  message,
  isTyping = false,
  displayedText,
  typingMessageId,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAnimating =
    !isUser &&
    isTyping &&
    message.id === typingMessageId &&
    displayedText !== undefined;
  const messageContent = message.content || '';
  const displayContent = isAnimating ? displayedText : messageContent;
  const showCursor = isAnimating && displayedText && message.content
    ? displayedText.length < message.content.length
    : false;

  return (
    <View
      className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gray-900 rounded-br-sm'
            : 'bg-gray-100 rounded-bl-sm'
        }`}
      >
        <Text
          className={`text-base ${isUser ? 'text-white' : 'text-gray-900'}`}
        >
          {displayContent}
          {showCursor && <Text className="opacity-50">▊</Text>}
        </Text>
      </View>
    </View>
  );
}

