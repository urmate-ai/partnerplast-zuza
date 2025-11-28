import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { formatMessageTime } from '../../shared/utils/date.utils';
import type { ChatMessage } from '../../shared/types';

type MessageBubbleProps = {
  message: ChatMessage;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <View
      className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}
      style={styles.messageContainer}
    >
      <View
        className={`rounded-2xl px-4 py-3 max-w-[85%] ${
          isUser
            ? 'bg-gray-900 rounded-br-sm'
            : 'bg-gray-100 rounded-bl-sm'
        }`}
      >
        <Text
          className={`text-base ${
            isUser ? 'text-white' : 'text-gray-900'
          }`}
        >
          {message.content}
        </Text>
      </View>
      <View className={`flex-row items-center mt-1 ${isUser ? 'flex-row-reverse' : ''}`}>
        <Ionicons
          name={isUser ? 'person' : 'chatbubble'}
          size={12}
          color="#9CA3AF"
        />
        <Text className="text-xs text-gray-500 mx-1">
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    minHeight: 40,
  },
});

