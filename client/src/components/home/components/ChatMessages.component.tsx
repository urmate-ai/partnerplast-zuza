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

  // Sprawdź czy ostatnia wiadomość asystenta ma status (zastępuje TypingIndicator)
  const hasActiveStatus = lastAssistantMessage?.status !== null && lastAssistantMessage?.status !== undefined;
  
  // Używaj animacji tylko gdy nie ma aktywnego statusu
  const shouldShowTypingAnimation = isTyping && !hasActiveStatus;

  const {
    displayedText,
    typingMessageId,
  } = useTypingAnimation({
    message: lastAssistantMessage,
    isTyping: shouldShowTypingAnimation,
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
    isTyping: shouldShowTypingAnimation,
  });

  if (messages.length === 0 && !isTyping && !hasActiveStatus) {
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
            isTyping={shouldShowTypingAnimation && index === messages.length - 1}
            displayedText={displayedText}
            typingMessageId={typingMessageId}
          />
        ))}

        {/* Pokazuj TypingIndicator tylko gdy nie ma aktywnego statusu */}
        {isTyping && !hasActiveStatus && (
          <View 
            style={{ 
              flexDirection: 'row', 
              justifyContent: 'flex-start' 
            }}
          >
            <View 
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 16,
                borderBottomLeftRadius: 4,
              }}
            >
              <TypingIndicator isVisible={true} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
