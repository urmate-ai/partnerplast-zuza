import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import { useChatHistory } from '../../shared/hooks/chat/useChatHistory.hook';
import { deleteChat } from '../../services/chats.service';
import { DeleteChatModal } from './DeleteChatModal.component';
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
  const queryClient = useQueryClient();
  const { data: chatHistory, isLoading } = useChatHistory();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChatPress = (chatId: string) => {
    if (onChatPress) {
      onChatPress(chatId);
    } else {
      navigation.navigate('ChatDetail', { chatId });
    }
  };

  const handleDeletePress = (chat: ChatHistoryItem, e: any) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return;

    try {
      setIsDeleting(true);
      await deleteChat(chatToDelete.id);
      console.log('[DrawerChatHistory] ✅ Chat usunięty:', chatToDelete.id);
      
      // Odśwież listę chatów
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      setDeleteModalVisible(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('[DrawerChatHistory] ❌ Błąd podczas usuwania chatu:', error);
      // Można dodać toast z błędem
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setChatToDelete(null);
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
              <Pressable
                onPress={(e) => handleDeletePress(chat, e)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
              <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          </Pressable>
        ))
      ) : (
        <Text className="text-sm text-gray-400 text-center py-5 px-5">
          Brak historii czatów
        </Text>
      )}

      <DeleteChatModal
        visible={deleteModalVisible}
        chatTitle={chatToDelete?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </View>
  );
};

