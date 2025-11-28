import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { ChatHistoryItem } from '../../shared/types';

type ChatCardProps = {
  chat: ChatHistoryItem;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SearchChats'>;

export const ChatCard: React.FC<ChatCardProps> = ({ chat }) => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className="mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      onPress={() => navigation.navigate('ChatDetail', { chatId: chat.id })}
    >
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {chat.title}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500 ml-1">{chat.timestamp}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
};

