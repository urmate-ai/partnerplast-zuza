import React from 'react';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { Button } from '../../shared/components/Button.component';
import { SafeAreaView } from '../../shared/components/SafeAreaView.component';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerMenu } from '../../components/DrawerMenu.component';
import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../shared/hooks/auth/useAuth.hook';
import { useHomeScreen } from '../../shared/hooks/chat/useHomeScreen.hook';
import { HomeHeader } from '../../components/home/components/HomeHeader.component';
import { VoiceControl } from '../../components/home/VoiceControl.component';
import { ChatMessages } from '../../components/home/components/ChatMessages.component';
import { EmailComposerModal } from '../../components/integrations/components/EmailComposerModal.component';
import { EventComposerModal } from '../../components/integrations/components/EventComposerModal.component';
import { useGmailSend } from '../../shared/hooks/integrations/useGmailIntegration.hook';
import { useCreateEvent } from '../../shared/hooks/integrations/useCalendarIntegration.hook';

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const insets = useSafeAreaInsets();
  const [voiceControlHeight, setVoiceControlHeight] = React.useState(0);
  const [ttsButtonHeight, setTtsButtonHeight] = React.useState(0);
  
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    voiceState,
    startListening,
    stopListening,
    messages,
    isLoading,
    isTyping,
    error,
    ttsState,
    speak,
    stopTTS,
    handleTypingComplete,
    handleNewChat,
    emailIntent,
    clearEmailIntent,
    calendarIntent,
    clearCalendarIntent,
  } = useHomeScreen();

  const gmailSendMutation = useGmailSend();
  const createEventMutation = useCreateEvent();

  React.useEffect(() => {
    const hasAssistantMessage = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant';
    if (!hasAssistantMessage) {
      setTtsButtonHeight(0);
    }
  }, [messages]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSendEmail = async (emailData: {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
  }) => {
    await gmailSendMutation.mutateAsync(emailData);
  };

  const handleCreateEvent = async (eventData: {
    calendarId: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  }) => {
    await createEventMutation.mutateAsync(eventData);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {isDrawerOpen && (
        <DrawerMenu
          onClose={() => setIsDrawerOpen(false)}
          userName={user?.name}
          onNewChat={handleNewChat}
        />
      )}

      <View className="pt-4 px-4">
        <HomeHeader
          onMenuPress={() => setIsDrawerOpen(true)}
          onLogout={handleLogout}
        />
      </View>

      <View className="flex-1 px-4 py-4">
        <ChatMessages
          messages={messages}
          isTyping={isTyping || isLoading}
          onTypingComplete={handleTypingComplete}
          bottomControlsHeight={voiceControlHeight + ttsButtonHeight}
        />
      </View>

      {error && (
        <View className="px-4 pb-2">
          <View className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text className="text-red-800 text-sm">{error}</Text>
          </View>
        </View>
      )}

      <View 
        style={{ paddingBottom: Math.max(insets.bottom, 16) }} 
        className="items-center pt-4"
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setVoiceControlHeight(height);
        }}
      >
        <VoiceControl
          isListening={voiceState.isListening}
          onPress={() =>
            voiceState.isListening ? stopListening() : startListening()
          }
        />
      </View>

      {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' ? (
        <View 
          style={{ paddingBottom: Math.max(insets.bottom, 16) }} 
          className="px-4"
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setTtsButtonHeight(height);
          }}
        >
          <Button
            onPress={() => {
              if (ttsState.isSpeaking) {
                stopTTS();
              } else {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  speak(lastMessage.content);
                }
              }
            }}
            variant="secondary"
            size="sm"
            className="self-center"
          >
            {ttsState.isSpeaking ? 'Zatrzymaj mówienie' : 'Odtwórz odpowiedź'}
          </Button>
        </View>
      ) : null}

      <EmailComposerModal
        visible={!!emailIntent?.shouldSendEmail}
        onClose={clearEmailIntent}
        onSend={handleSendEmail}
        initialData={emailIntent || undefined}
        isLoading={gmailSendMutation.isPending}
      />

      <EventComposerModal
        visible={!!calendarIntent?.shouldCreateEvent}
        onClose={clearCalendarIntent}
        onSave={handleCreateEvent}
        initialData={calendarIntent || undefined}
        isLoading={createEventMutation.isPending}
      />
      
      {calendarIntent && !calendarIntent.shouldCreateEvent && (
        <View className="px-4 pb-2">
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <Text className="text-yellow-800 text-sm">
              Debug: calendarIntent istnieje ale shouldCreateEvent = false
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
