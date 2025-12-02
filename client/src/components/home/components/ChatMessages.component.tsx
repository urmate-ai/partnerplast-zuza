import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { View } from '../../../shared/components/View.component';
import { MessageBubble } from './MessageBubble.component';
import { EmptyState } from './EmptyState.component';
import { TypingIndicator } from './TypingIndicator.component';
import { useAutoScroll } from '../hooks/useAutoScroll.hook';
import { useTypingAnimation } from '../hooks/useTypingAnimation.hook';
import type { ChatMessagesProps } from '../types/message.types';

export function ChatMessages({
  messages,
  isTyping = false,
  onTypingComplete,
}: ChatMessagesProps) {
  const lastAssistantMessage = useMemo(
    () => messages.filter((m) => m.role === 'assistant').pop(),
    [messages],
  );

  const {
    displayedText,
    typingMessageId,
  } = useTypingAnimation({
    message: lastAssistantMessage,
    isTyping,
    onTypingComplete,
  });

  const {
    scrollViewRef,
    handleScroll,
    handleMomentumScrollEnd,
    handleContentSizeChange,
    handleLayout,
  } = useAutoScroll({
    messagesCount: messages.length,
    displayedText,
    isTyping,
  });

  if (messages.length === 0 && !isTyping) {
    return <EmptyState />;
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      onScroll={handleScroll}
      onMomentumScrollEnd={handleMomentumScrollEnd}
    >
      <View className="gap-4 px-2">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || index}
            message={message}
            isTyping={isTyping && index === messages.length - 1}
            displayedText={displayedText}
            typingMessageId={typingMessageId}
          />
        ))}

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
}
