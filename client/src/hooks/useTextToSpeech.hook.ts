import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { synthesizeToAudio } from '../services/tts/elevenlabs-tts.service';
import * as Speech from 'expo-speech';

export type UseTextToSpeechState = {
  isSpeaking: boolean;
  lastText?: string;
};

export const useTextToSpeech = () => {
  const [state, setState] = useState<UseTextToSpeechState>({
    isSpeaking: false,
    lastText: undefined,
  });
  const soundRef = useRef<Audio.Sound | null>(null);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
      } catch {
      }
      try {
        await soundRef.current.unloadAsync();
      } catch {
      }
      soundRef.current = null;
    }
    try {
      Speech.stop();
    } catch {
    }
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  const speak = useCallback(
    async (text: string, lang: string = 'pl-PL') => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      await stop();

      setState({ isSpeaking: true, lastText: trimmed });

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      try {
        // Próbuj użyć ElevenLabs TTS (jeśli skonfigurowane)
        const audioResult = await synthesizeToAudio(trimmed);
        
        if (audioResult) {
          // Używamy ElevenLabs TTS
          const { sound } = await Audio.Sound.createAsync({ uri: audioResult.uri });
          soundRef.current = sound;

          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;

            const hasFinished =
              status.didJustFinish ||
              (typeof status.durationMillis === 'number' &&
                status.positionMillis >= status.durationMillis);

            if (hasFinished) {
              setState((prev) => ({ ...prev, isSpeaking: false }));
            }
          });

          await sound.playAsync();
        } else {
          // Fallback do expo-speech (wbudowany TTS)
          console.log('[useTextToSpeech] Using expo-speech as fallback');
          await Speech.speak(trimmed, {
            language: lang,
            onDone: () => {
              setState((prev) => ({ ...prev, isSpeaking: false }));
            },
            onStopped: () => {
              setState((prev) => ({ ...prev, isSpeaking: false }));
            },
            onError: (error) => {
              console.error('[useTextToSpeech] Speech error:', error);
              setState((prev) => ({ ...prev, isSpeaking: false }));
            },
          });
        }
      } catch (error) {
        console.error('[useTextToSpeech] Failed to play TTS', error);
        // Fallback do expo-speech
        try {
          await Speech.speak(trimmed, {
            language: lang,
            onDone: () => {
              setState((prev) => ({ ...prev, isSpeaking: false }));
            },
            onStopped: () => {
              setState((prev) => ({ ...prev, isSpeaking: false }));
            },
            onError: (error) => {
              console.error('[useTextToSpeech] Speech error:', error);
              setState((prev) => ({ ...prev, isSpeaking: false }));
            },
          });
        } catch (speechError) {
          console.error('[useTextToSpeech] Failed to use expo-speech fallback', speechError);
          setState((prev) => ({ ...prev, isSpeaking: false }));
        }
      }
    },
    [stop],
  );

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { state, speak, stop };
};


