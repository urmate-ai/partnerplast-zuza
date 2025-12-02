import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { API_URL } from '../shared/utils/api';

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

      const ttsUrl = `${API_URL}/api/v1/ai/tts?text=${encodeURIComponent(
        trimmed,
      )}`;

      try {
        const { sound } = await Audio.Sound.createAsync({ uri: ttsUrl });
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
      } catch (error) {
        console.error('[useTextToSpeech] Failed to play ElevenLabs TTS', error);
        setState((prev) => ({ ...prev, isSpeaking: false }));
      }
    },
    [stop],
  );

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  return { state, speak, stop };
};


