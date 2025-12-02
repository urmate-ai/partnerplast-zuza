import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
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
  const [displayedReply, setDisplayedReply] = useState<string>('');
  const typingMessageIdRef = useRef<string | null>(null);
  const shouldScrollToEndRef = useRef<boolean>(true);
  const contentHeightRef = useRef<number>(0);
  const scrollViewHeightRef = useRef<number>(0);

  const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop();
  const isLastMessageTyping = isTyping && lastAssistantMessage?.content;
  
  const scrollToEnd = (animated = true, force = false) => {
    if (scrollViewRef.current && (shouldScrollToEndRef.current || force)) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  };

  const isNearBottom = (contentHeight: number, scrollY: number, layoutHeight: number): boolean => {
    const threshold = 50;
    return contentHeight - scrollY - layoutHeight < threshold;
  };
  
  useEffect(() => {
    if (isTyping && lastAssistantMessage) {
      const currentMessageId = lastAssistantMessage.id;
      if (typingMessageIdRef.current !== currentMessageId) {
        typingMessageIdRef.current = currentMessageId || null;
        setDisplayedReply(''); 
      }
    } else if (!isTyping) {
      typingMessageIdRef.current = null;
    }
  }, [isTyping, lastAssistantMessage?.id]);

  useEffect(() => {
    if (isLastMessageTyping && lastAssistantMessage && lastAssistantMessage.content) {
      const fullText = lastAssistantMessage.content;
      const messageId = lastAssistantMessage.id;
      
      if (typingMessageIdRef.current !== messageId) {
        return;
      }

      let currentIndex = 0;
      setDisplayedReply('');

      const typingInterval = setInterval(() => {
        if (typingMessageIdRef.current !== messageId) {
          clearInterval(typingInterval);
          return;
        }

        if (currentIndex < fullText.length) {
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
          if (onTypingComplete && typingMessageIdRef.current === messageId) {
            setTimeout(() => onTypingComplete(), 100);
          }
        }
      }, 20); 

      return () => clearInterval(typingInterval);
    } else if (lastAssistantMessage && !isTyping && lastAssistantMessage.content) {
      setDisplayedReply(lastAssistantMessage.content);
    }
  }, [isLastMessageTyping, lastAssistantMessage?.id, lastAssistantMessage?.content, isTyping, onTypingComplete]);

  useEffect(() => {
    scrollToEnd(true, true);
  }, [messages.length]);

  useEffect(() => {
    if (displayedReply) {
      scrollToEnd(false, true);
    }
  }, [displayedReply]);

  useEffect(() => {
    if (!isTyping && displayedReply) {
      scrollToEnd(true, true);
    }
  }, [isTyping, displayedReply]);

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
      onContentSizeChange={(contentWidth, contentHeight) => {
        contentHeightRef.current = contentHeight;
        scrollToEnd();
      }}
      onLayout={(event) => {
        scrollViewHeightRef.current = event.nativeEvent.layout.height;
        scrollToEnd();
      }}
      onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isAtBottom = isNearBottom(
          contentSize.height,
          contentOffset.y,
          layoutMeasurement.height,
        );
        
        shouldScrollToEndRef.current = isAtBottom;
      }}
      onScrollBeginDrag={() => {
      }}
      onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isAtBottom = isNearBottom(
          contentSize.height,
          contentOffset.y,
          layoutMeasurement.height,
        );
        shouldScrollToEndRef.current = isAtBottom;
      }}
    >
      <View className="gap-4 px-2">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';

          const isLastMessage = index === messages.length - 1;
          const isThisMessageTyping = !isUser && isLastMessage && message.id === typingMessageIdRef.current && isTyping;
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
                {isThisMessageTyping && lastAssistantMessage?.content && message.id === lastAssistantMessage.id ? (
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

        {isTyping && (
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

