import React from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { getChatById } from '../services/chats.service';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ChatWithMessages } from '../shared/types';

type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type ChatDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChatDetail'
>;

export const ChatDetailScreen: React.FC = () => {
  const route = useRoute<ChatDetailScreenRouteProp>();
  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const { chatId } = route.params;

  const { data: chat, isLoading, error } = useQuery<ChatWithMessages>({
    queryKey: ['chat', chatId],
    queryFn: () => getChatById(chatId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <View className="pt-14 px-6 pb-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 -ml-2 mb-4"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#111827" />
          <Text className="text-gray-500 mt-4">Ładowanie czatu...</Text>
        </View>
      </View>
    );
  }

  if (error || !chat) {
    return (
      <View className="flex-1 bg-white">
        <View className="pt-14 px-6 pb-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 -ml-2 mb-4"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-red-500 text-center mt-4">
            {error instanceof Error ? error.message : 'Błąd podczas ładowania czatu'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">  
      <View className="pt-14 px-6 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text variant="h1" className="flex-1 text-center">
            {chat.title}
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-4">
          {chat.messages.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                Ten czat jest pusty
              </Text>
            </View>
          ) : (
            chat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

type MessageBubbleProps = {
  message: ChatWithMessages['messages'][0];
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
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

const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) {
    return 'Teraz';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min temu`;
  } else if (diffHours < 24) {
    return `${diffHours} godz. temu`;
  } else {
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  messageContainer: {
    minHeight: 40,
  },
});

