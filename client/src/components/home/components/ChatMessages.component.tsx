import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  bottomControlsHeight = 0,
}: ChatMessagesProps) {
  const insets = useSafeAreaInsets();
  
  const lastAssistantMessage = useMemo(
    () => messages.filter((m) => m.role === 'assistant').pop(),
    [messages],
  );

  const hasActiveStatus = lastAssistantMessage?.status !== null && lastAssistantMessage?.status !== undefined;
  
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
    bottomControlsHeight,
  });

  if (messages.length === 0 && !isTyping && !hasActiveStatus) {
    return <EmptyState />;
  }

  const bottomPadding = bottomControlsHeight > 0 
    ? bottomControlsHeight + 32
    : Math.max(insets.bottom, 16) + 180;

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={handleContentSizeChange}
      onLayout={handleLayout}
      onScroll={handleScroll}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      scrollEventThrottle={16}
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
