import React from 'react';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { SafeAreaView } from '../../shared/components/SafeAreaView.component';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerMenu } from '../../components/DrawerMenu.component';
import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../shared/hooks/auth/useAuth.hook';
import { useHomeScreen } from '../../shared/hooks/chat/useHomeScreen.hook';
import { HomeHeader } from '../../components/home/components/HomeHeader.component';
import { SiriChatView } from '../../components/home/components/SiriChatView.component';
import { SiriVoiceButton } from '../../components/home/components/SiriVoiceButton.component';
import { EmailComposerModal } from '../../components/integrations/components/EmailComposerModal.component';
import { EventComposerModal } from '../../components/integrations/components/EventComposerModal.component';
import { useGmailSend } from '../../shared/hooks/integrations/useGmailIntegration.hook';
import { useCreateEvent } from '../../shared/hooks/integrations/useCalendarIntegration.hook';

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const insets = useSafeAreaInsets();
  
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    voiceState,
    startListening,
    stopListening,
    lastUserMessage,
    lastAssistantMessage,
    currentStatus,
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

      {/* Główny widok czatu w stylu Siri */}
      <View className="flex-1">
        <SiriChatView
          userMessage={lastUserMessage}
          assistantMessage={lastAssistantMessage}
          currentStatus={currentStatus}
        />
      </View>

      {/* Błąd */}
      {error && (
        <View className="px-4 pb-4">
          <View className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text className="text-red-800 text-sm text-center">{error}</Text>
          </View>
        </View>
      )}

      {/* Przycisk głosowy w stylu Siri */}
      <View 
        style={{ paddingBottom: Math.max(insets.bottom, 24), paddingTop: 24 }} 
        className="items-center"
      >
        <SiriVoiceButton
          isListening={voiceState.isListening}
          isProcessing={isLoading || isTyping || !!currentStatus}
          onPress={() => {
            if (voiceState.isListening) {
              stopListening();
            } else {
              startListening();
            }
          }}
        />
      </View>

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
    </SafeAreaView>
  );
};
