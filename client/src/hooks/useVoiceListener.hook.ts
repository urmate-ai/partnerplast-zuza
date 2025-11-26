import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

type UseVoiceListenerOptions = {
  autoStart?: boolean;
  silenceThreshold?: number;
  silenceDurationMs?: number;
};

export type UseVoiceListenerState = {
  isListening: boolean;
  hasPermission: boolean;
  level: number | null;
};

export const useVoiceListener = (
  options: UseVoiceListenerOptions = {},
): [UseVoiceListenerState, () => Promise<void>, () => Promise<void>] => {
  const {
    autoStart = true,
    silenceThreshold = -55,
    silenceDurationMs = 1500,
  } = options;

  const [state, setState] = useState<UseVoiceListenerState>({
    isListening: false,
    hasPermission: false,
    level: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAboveThresholdRef = useRef<number | null>(null);

  const requestPermission = async () => {
    const result = await Audio.requestPermissionsAsync();
    if (result.granted) {
      setState((prev) => ({ ...prev, hasPermission: true }));
    }
    return result;
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const stopListening = async () => {
    stopPolling();
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
      }
      recordingRef.current = null;
    }
    setState((prev) => ({ ...prev, isListening: false, level: null }));
  };

  const startListening = async () => {
    const permission = await requestPermission();
    if (!permission.granted) {
      return;
    }

    try {
      await stopListening();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        (recording as unknown as { _options: { isMeteringEnabled: boolean } })._options = {
          ...(recording as unknown as { _options: { isMeteringEnabled: boolean } })._options,
          isMeteringEnabled: true,
        };
      }

      await recording.startAsync();

      recordingRef.current = recording;
      lastAboveThresholdRef.current = Date.now();

      setState((prev) => ({ ...prev, isListening: true }));

      pollIntervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        try {
          const status = await recordingRef.current.getStatusAsync();
          const metering = (status as any).metering ?? null;

          setState((prev) => ({
            ...prev,
            level: typeof metering === 'number' ? metering : null,
          }));

          const now = Date.now();
          if (typeof metering === 'number' && metering > silenceThreshold) {
            lastAboveThresholdRef.current = now;
          }

          if (
            lastAboveThresholdRef.current &&
            now - lastAboveThresholdRef.current > silenceDurationMs
          ) {
            await stopListening();
          }
        } catch {
          await stopListening();
        }
      }, 200);
    } catch {
      await stopListening();
    }
  };

  useEffect(() => {
    if (autoStart) {
      void startListening();
    }

    return () => {
      stopPolling();
      void stopListening();
    };
  }, []);

  return [state, startListening, stopListening];
};


