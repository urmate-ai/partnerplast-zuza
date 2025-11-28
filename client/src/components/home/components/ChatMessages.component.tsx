import React, { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';
import { TypingIndicator } from './TypingIndicator.component';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

type ChatMessagesProps = {
  messages: Message[];
  isTyping?: boolean;
  onTypingComplete?: () => void;
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping = false,
  onTypingComplete,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const displayedContentRef = useRef<string>('');
  const [displayedReply, setDisplayedReply] = React.useState<string>('');
  const typingMessageIdRef = React.useRef<string | null>(null);

  // Find the last assistant message that's being typed
  const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop();
  const isLastMessageTyping = isTyping && lastAssistantMessage?.content;
  
  // Track which message is currently being typed
  React.useEffect(() => {
    if (isTyping && lastAssistantMessage) {
      typingMessageIdRef.current = lastAssistantMessage.id || null;
    } else if (!isTyping) {
      typingMessageIdRef.current = null;
    }
  }, [isTyping, lastAssistantMessage?.id]);

  useEffect(() => {
    // Reset displayed reply when a new assistant message starts typing
    if (isLastMessageTyping && lastAssistantMessage && lastAssistantMessage.content) {
      setDisplayedReply('');
    }
  }, [lastAssistantMessage?.id]); // Reset when message ID changes

  useEffect(() => {
    if (isLastMessageTyping && lastAssistantMessage && lastAssistantMessage.content) {
      // Simulate typing animation
      const fullText = lastAssistantMessage.content;
      let currentIndex = 0;
      setDisplayedReply('');

      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          // Variable speed: faster for spaces, slower for punctuation
          const charIndex = Math.floor(currentIndex);
          const char = charIndex < fullText.length ? fullText[charIndex] : '';
          const isPunctuation = /[.,!?;:]/.test(char);
          const increment = char === ' ' ? 2 : isPunctuation ? 0.5 : 1;
          currentIndex += increment;
          const displayText = fullText.substring(0, Math.min(Math.floor(currentIndex), fullText.length));
          setDisplayedReply(displayText);
        } else {
          clearInterval(typingInterval);
          setDisplayedReply(fullText);
          if (onTypingComplete) {
            setTimeout(() => onTypingComplete(), 100);
          }
        }
      }, 20); // Update every 20ms for smooth animation

      return () => clearInterval(typingInterval);
    } else if (lastAssistantMessage && !isTyping && lastAssistantMessage.content) {
      // If not typing, show full message
      setDisplayedReply(lastAssistantMessage.content);
    }
  }, [isLastMessageTyping, lastAssistantMessage?.id, lastAssistantMessage?.content, isTyping, onTypingComplete]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, displayedReply]);

  if (messages.length === 0 && !isTyping) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-gray-400 text-center">
          Rozpocznij rozmowę z Zuza, aby zobaczyć wiadomości tutaj
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-4 px-2">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isThisMessageTyping = !isUser && message.id === typingMessageIdRef.current && isTyping;
          const messageContent = message.content || '';

          return (
            <View
              key={message.id || index}
              className={`flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <View
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'bg-gray-900 rounded-br-sm'
                    : 'bg-gray-100 rounded-bl-sm'
                }`}
              >
                {isThisMessageTyping && lastAssistantMessage?.content ? (
                  <Text
                    className={`text-base ${
                      isUser ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {displayedReply}
                    {displayedReply.length < lastAssistantMessage.content.length && (
                      <Text className="opacity-50">▊</Text>
                    )}
                  </Text>
                ) : (
                  <Text
                    className={`text-base ${
                      isUser ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {messageContent}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {isTyping && (!lastAssistantMessage || displayedReply.length === 0) && (
          <View className="flex-row justify-start">
            <View className="bg-gray-100 rounded-2xl rounded-bl-sm">
              <TypingIndicator isVisible={true} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

