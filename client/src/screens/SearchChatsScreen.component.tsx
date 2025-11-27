import React, { useState, useMemo } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { useChats } from '../shared/hooks/useChats.hook';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ChatHistoryItem } from '../shared/types';

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
      {/* Header */}
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
            Wyszukaj czaty
          </Text>
          <View className="w-10" />
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2">
          <Ionicons name="search-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Szukaj w czatach..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-gray-900"
            style={{ fontSize: 16, color: '#111827' }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              className="p-1"
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="text-gray-500 mt-4">Ładowanie czatów...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-red-500 text-center mt-4">
              {error instanceof Error ? error.message : 'Błąd podczas ładowania czatów'}
            </Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-4">
              {searchQuery
                ? 'Nie znaleziono czatów pasujących do wyszukiwania'
                : 'Brak historii czatów'}
            </Text>
            {!searchQuery && (
              <Text className="text-gray-400 text-center mt-2 text-sm">
                Rozpocznij rozmowę z AI, aby zobaczyć tutaj historię
              </Text>
            )}
          </View>
        ) : (
          <View className="px-6 pt-6">
            {filteredChats.map((chat) => (
              <ChatCard key={chat.id} chat={chat} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

type ChatCardProps = {
  chat: ChatHistoryItem;
};

const ChatCard: React.FC<ChatCardProps> = ({ chat }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <View className="flex-row items-start">
        {/* Icon */}
        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {chat.title}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1">{chat.timestamp}</Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
};


