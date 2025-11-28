import React, { useState, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../../shared/components/View.component';
import { ScreenHeader } from '../../shared/components/ScreenHeader.component';
import { SearchBar } from '../../shared/components/SearchBar.component';
import { LoadingState } from '../../shared/components/LoadingState.component';
import { ErrorState } from '../../shared/components/ErrorState.component';
import { EmptyState } from '../../shared/components/EmptyState.component';
import { ChatCard } from '../../components/chat/ChatCard.component';
import { useChats } from '../../shared/hooks/chat/useChats.hook';
import { getErrorMessage } from '../../shared/utils/error.utils';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { ChatHistoryItem } from '../../shared/types';

type SearchChatsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SearchChats'
>;

export const SearchChatsScreen: React.FC = () => {
  const navigation = useNavigation<SearchChatsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: chats, isLoading, error } = useChats(searchQuery.trim() || undefined);

  const filteredChats = useMemo(() => {
    if (!chats) return [];
    return chats;
  }, [chats]);

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Wyszukaj czaty" onBack={() => navigation.goBack()} />
      <View className="px-6">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Szukaj w czatach..."
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {isLoading ? (
          <LoadingState message="Ładowanie czatów..." />
        ) : error ? (
          <ErrorState message={getErrorMessage(error)} />
        ) : filteredChats.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title={
              searchQuery
                ? 'Nie znaleziono czatów pasujących do wyszukiwania'
                : 'Brak historii czatów'
            }
            description={
              !searchQuery
                ? 'Rozpocznij rozmowę z AI, aby zobaczyć tutaj historię'
                : undefined
            }
          />
        ) : (
          <View className="px-6 pt-6">
            {filteredChats.map((chat: ChatHistoryItem) => (
              <ChatCard key={chat.id} chat={chat} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};


