import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { View } from '../../shared/components/View.component';
import { ScreenHeader } from '../../shared/components/ScreenHeader.component';
import { LoadingState } from '../../shared/components/LoadingState.component';
import { ErrorState } from '../../shared/components/ErrorState.component';
import { EmptyState } from '../../shared/components/EmptyState.component';
import { MessageBubble } from '../../components/chat/MessageBubble.component';
import { getChatById } from '../../services/chats.service';
import { getErrorMessage } from '../../shared/utils/error.utils';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { ChatWithMessages } from '../../shared/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
        <ScreenHeader title="Czat" onBack={() => navigation.goBack()} />
        <LoadingState message="Ładowanie czatu..." />
      </View>
    );
  }

  if (error || !chat) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Czat" onBack={() => navigation.goBack()} />
        <ErrorState message={error ? getErrorMessage(error) : 'Błąd podczas ładowania czatu'} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={chat.title} onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-4">
          {chat.messages.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="Ten czat jest pusty"
            />
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

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
});

