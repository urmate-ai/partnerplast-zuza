import { useCallback, useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

export type UseTextToSpeechState = {
  isSpeaking: boolean;
  lastText?: string;
};

export const useTextToSpeech = () => {
  const [state, setState] = useState<UseTextToSpeechState>({
    isSpeaking: false,
    lastText: undefined,
  });

  const stop = useCallback(() => {
    Speech.stop();
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  const speak = useCallback(
    (text: string, lang: string = 'pl-PL') => {
      if (!text?.trim()) return;

      stop();

      void Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      Speech.speak(text, {
        language: lang,
        pitch: 1.0,
        rate: 0.95,
        volume: 1.0,
        onStart: () => {
          setState({ isSpeaking: true, lastText: text });
        },
        onDone: () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
        },
        onStopped: () => {
          setState((prev) => ({ ...prev, isSpeaking: false }));
        },
      });
    },
    [stop],
  );

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return { state, speak, stop };
};


