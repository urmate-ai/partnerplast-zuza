import React from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import { useChatHistory } from '../../shared/hooks/chat/useChatHistory.hook';
import type { ChatHistoryItem } from '../../shared/types';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type DrawerChatHistoryNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type DrawerChatHistoryProps = {
  onChatPress?: (chatId: string) => void;
};

export const DrawerChatHistory: React.FC<DrawerChatHistoryProps> = ({
  onChatPress,
}) => {
  const navigation = useNavigation<DrawerChatHistoryNavigationProp>();
  const { data: chatHistory, isLoading } = useChatHistory();

  const handleChatPress = (chatId: string) => {
    if (onChatPress) {
      onChatPress(chatId);
    } else {
      navigation.navigate('ChatDetail', { chatId });
    }
  };

  return (
    <View className="py-4">
      <Text className="text-xs font-semibold text-gray-500 px-5 mb-2 uppercase tracking-wide">
        Twoje czaty
      </Text>

      {isLoading ? (
        <View className="flex-row items-center justify-center py-5">
          <LoadingSpinner message="Ładowanie..." />
        </View>
      ) : chatHistory && chatHistory.length > 0 ? (
        chatHistory.map((chat: ChatHistoryItem) => (
          <Pressable key={chat.id} onPress={() => handleChatPress(chat.id)}>
            <View className="flex-row items-center justify-between px-5 py-3">
              <View className="flex-1 mr-2">
                <Text className="text-sm text-gray-900 font-medium mb-0.5" numberOfLines={1}>
                  {chat.title}
                </Text>
                <Text className="text-xs text-gray-400">{chat.timestamp}</Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
            </View>
          </Pressable>
        ))
      ) : (
        <Text className="text-sm text-gray-400 text-center py-5 px-5">
          Brak historii czatów
        </Text>
      )}
    </View>
  );
};

