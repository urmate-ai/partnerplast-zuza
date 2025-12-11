import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { View as CustomView } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';
import type { Message, ProcessingStatus } from '../types/message.types';

interface SiriChatViewProps {
  userMessage: Message | null;
  assistantMessage: Message | null;
  currentStatus: ProcessingStatus | null;
  statusText?: string;
}

const getStatusText = (status: ProcessingStatus | null): string => {
  if (!status) return '';
  
  const statusTexts: Record<string, string> = {
    'transcribing': 'Przetwarzam mowę...',
    'classifying': 'Badam intencję...',
    'checking_email': 'Sprawdzam maila...',
    'checking_calendar': 'Sprawdzam kalendarz...',
    'checking_contacts': 'Przeszukuję kontakty...',
    'web_searching': 'Szukam w internecie...',
    'preparing_response': 'Szykuję odpowiedź...',
  };
  
  return statusTexts[status] || '';
};

const getStatusIcon = (status: ProcessingStatus | null): string => {
  if (!status) return '';
  
  const icons: Record<string, string> = {
    'transcribing': '🎤',
    'classifying': '🤔',
    'checking_email': '📧',
    'checking_calendar': '📅',
    'checking_contacts': '👤',
    'web_searching': '🌐',
    'preparing_response': '💭',
  };
  
  return icons[status] || '⏳';
};

export const SiriChatView: React.FC<SiriChatViewProps> = ({
  userMessage,
  assistantMessage,
  currentStatus,
  statusText,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (userMessage || assistantMessage) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [userMessage?.id, userMessage?.content, assistantMessage?.id, fadeAnim]);

  useEffect(() => {
    if (assistantMessage && !currentStatus) {
      const content = assistantMessage.content || '';
      if (content.length === 0) {
        setDisplayedContent('');
        return;
      }

      let index = 0;
      setDisplayedContent('');
      
      const interval = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.substring(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    } else if (assistantMessage) {
      setDisplayedContent(assistantMessage.content || '');
    }
  }, [assistantMessage?.id, assistantMessage?.content, currentStatus]);

  const statusDisplayText = statusText || getStatusText(currentStatus);

  return (
    <CustomView className="flex-1 justify-center items-center px-6">
      <Animated.View
        style={{
          opacity: fadeAnim,
          width: '100%',
          maxWidth: 600,
        }}
        className="gap-8"
      >
        {userMessage && (
          <CustomView className="items-center">
            <CustomView className="bg-gray-900 rounded-3xl px-6 py-4 max-w-full">
              <Text className="text-white text-lg text-center">
                {userMessage.content}
              </Text>
            </CustomView>
          </CustomView>
        )}

        {currentStatus && statusDisplayText && (
          <CustomView className="items-center">
            <CustomView className="bg-gray-100 rounded-3xl px-6 py-4 max-w-full">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{getStatusIcon(currentStatus)}</Text>
                <Text className="text-gray-600 text-base">
                  {statusDisplayText}
                </Text>
              </View>
            </CustomView>
          </CustomView>
        )}

        {assistantMessage && !currentStatus && (
          <CustomView className="items-center">
            <CustomView className="bg-gray-100 rounded-3xl px-6 py-5 max-w-full">
              <Text className="text-gray-900 text-lg text-center leading-6">
                {displayedContent}
                {displayedContent.length < (assistantMessage.content?.length || 0) && (
                  <Text className="opacity-50">▊</Text>
                )}
              </Text>
            </CustomView>
          </CustomView>
        )}

        {!userMessage && !assistantMessage && !currentStatus && (
          <CustomView className="items-center">
            <Text className="text-gray-400 text-base">
              Powiedz coś, a Zuza Ci odpowie
            </Text>
          </CustomView>
        )}
      </Animated.View>
    </CustomView>
  );
};

