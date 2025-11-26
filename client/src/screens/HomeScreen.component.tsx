import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MenuButton } from '../components/MenuButton.component';
import { ListeningIndicator } from '../components/ListeningIndicator.component';
import { useVoiceListener } from '../hooks/useVoiceListener.hook';
import { useTextToSpeech } from '../hooks/useTextToSpeech.hook';
import { sendVoiceToAi } from '../services/ai.service';
import { useAuthStore } from '../stores/authStore';

export const HomeScreen: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const [voiceState, startListening, stopListening] = useVoiceListener({
    autoStart: false,
    onStop: async (uri) => {
      if (!uri) return;
      setError(null);
      setIsLoading(true);
      try {
        const result = await sendVoiceToAi(uri, {
          language: 'pl',
        });
        setTranscript(result.transcript);
        setReply(result.reply);
        speak(result.reply);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Coś poszło nie tak po stronie AI.',
        );
      } finally {
        setIsLoading(false);
      }
    },
  });
  const { state: ttsState, speak } = useTextToSpeech();
  const [transcript, setTranscript] = useState<string>('');
  const [reply, setReply] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await clearAuth();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MenuButton />
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Wyloguj</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Cześć {user?.name}! Jestem Zuza, Twój asystent AI</Text>
        <Text style={styles.title}>Jestem gotowa do działania.</Text>
      </View>

      <View style={styles.bottomArea}>
        <Pressable
          style={styles.listeningContainer}
          onPress={() =>
            voiceState.isListening ? stopListening() : startListening()
          }
        >
          <ListeningIndicator isListening={voiceState.isListening} />
          <Text style={styles.listeningLabel}>
            {voiceState.isListening
              ? 'Słucham... dotknij, aby zakończyć'
              : 'Dotknij, aby zacząć mówić'}
          </Text>
        </Pressable>

        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Co właśnie mówisz</Text>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>
              {transcript.trim()
                ? transcript
                : 'Transkrypcja Twojej wypowiedzi pojawi się tutaj.'}
            </Text>
          </View>

          <View style={styles.replyContainer}>
            <Text style={styles.transcriptLabel}>Odpowiedź ZUZY</Text>
            {isLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#111827" />
                <Text style={styles.loadingText}>Zuza myśli...</Text>
              </View>
            )}
            {error && !isLoading && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            {!isLoading && !error && !!reply && (
              <View style={styles.replyBubble}>
                <Text style={styles.transcriptText}>{reply}</Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.replyButton,
                pressed && styles.replyButtonPressed,
              ]}
              onPress={() =>
                reply
                  ? speak(reply)
                  : speak(
                      'To jest przykładowa odpowiedź ZUZA. Gdy backend odpowie, usłyszysz tutaj prawdziwą odpowiedź.',
                    )
              }
            >
              <Text style={styles.replyButtonText}>
                {ttsState.isSpeaking ? 'Zatrzymaj mówienie' : 'Odtwórz odpowiedź'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  logoutText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  bottomArea: {
    alignItems: 'center',
    gap: 16,
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  listeningLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  transcriptContainer: {
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  transcriptBox: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 15,
    color: '#4B5563',
  },
  replyContainer: {
    marginTop: 16,
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  replyBubble: {
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  replyButtonPressed: {
    opacity: 0.85,
  },
  replyButtonText: {
    fontSize: 15,
    color: '#F9FAFB',
    fontWeight: '600',
  },
});

