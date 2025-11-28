import React from 'react';
import { View } from '../shared/components/View.component';
import { DrawerMenu } from '../components/DrawerMenu.component';
import { useAuthStore } from '../stores/authStore';
import { useLogout } from '../shared/hooks/useAuth.hook';
import { useHomeScreen } from '../shared/hooks/useHomeScreen.hook';
import { HomeHeader } from '../components/home/components/HomeHeader.component';
import { HomeContent } from '../components/home/components/HomeContent.component';
import { VoiceControl } from '../components/home/VoiceControl.component';
import { TranscriptSection } from '../components/home/components/TranscriptSection.component';
import { ReplySection } from '../components/home/components/ReplySection.component';

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    voiceState,
    startListening,
    stopListening,
    transcript,
    reply,
    isLoading,
    error,
    ttsState,
    speak,
  } = useHomeScreen();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View className="flex-1 bg-white pt-14 px-6 pb-8">
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userName={user?.name}
      />

      <HomeHeader
        onMenuPress={() => setIsDrawerOpen(true)}
        onLogout={handleLogout}
      />

      <HomeContent userName={user?.name} />

      <View className="items-center gap-4">
        <VoiceControl
          isListening={voiceState.isListening}
          onPress={() =>
            voiceState.isListening ? stopListening() : startListening()
          }
        />

        <TranscriptSection transcript={transcript} />

        <ReplySection
          isLoading={isLoading}
          error={error}
          reply={reply}
          ttsState={ttsState}
          speak={speak}
        />
      </View>
    </View>
  );
};
