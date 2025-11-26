import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MenuButton } from '../components/MenuButton.component';
import { ListeningIndicator } from '../components/ListeningIndicator.component';
import { useVoiceListener } from '../hooks/useVoiceListener.hook';

export const HomeScreen: React.FC = () => {
  const [voiceState] = useVoiceListener({
    autoStart: true,
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MenuButton />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Cześć ! Jestem Zuza, Twój asystent AI</Text>
        <Text style={styles.title}>Jestem gotowa do działania.</Text>
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.listeningContainer}>
          <ListeningIndicator isListening={voiceState.isListening} />
          <Text style={styles.listeningLabel}>
            {voiceState.isListening
              ? 'Słucham... mów śmiało'
              : 'Dotknij, aby mówić (wkrótce)'}
          </Text>
        </View>

        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Co właśnie mówisz</Text>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>
              Transkrypcja Twojej wypowiedzi pojawi się tutaj.
            </Text>
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
    justifyContent: 'flex-start',
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
});

