import { useState, useCallback } from 'react';
import * as SMS from 'expo-sms';
import { useVoiceListener } from '../../../hooks/useVoiceListener.hook';
import { useTextToSpeech } from '../../../hooks/useTextToSpeech.hook';
import { useVoiceAi } from './useVoiceAi.hook';
import { useAuthStore } from '../../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { getApproximateLocation, formatLocationForAi } from '../../utils/location.utils';
import { apiClient } from '../../utils/api';
import type { EmailIntent, CalendarIntent, SmsIntent } from '../../types/ai.types';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export const useHomeScreen = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [emailIntent, setEmailIntent] = useState<EmailIntent | null>(null);
  const [calendarIntent, setCalendarIntent] = useState<CalendarIntent | null>(null);
  const [smsIntent, setSmsIntent] = useState<SmsIntent | null>(null);

  const voiceAiMutation = useVoiceAi();
  const { state: ttsState, speak, stop: stopTTS } = useTextToSpeech();

  const [voiceState, startListening, stopListening] = useVoiceListener({
    autoStart: false,
    onStop: async (uri) => {
      if (!uri || !user?.id) return;
      setError(null);
      
      try {
        const userMessageId = `user-${Date.now()}`;
        const userMessage: Message = {
          id: userMessageId,
          role: 'user',
          content: 'Przetwarzanie mowy...',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        setIsTyping(true);
        const hookStartTime = performance.now();
        console.log(`[PERF] 🎤 [useHomeScreen] START voice processing | uri: ${uri.substring(0, 50)}... | timestamp: ${new Date().toISOString()}`);

        const locationStartTime = performance.now();
        console.log(`[PERF] 📍 [useHomeScreen] START location fetch | timestamp: ${new Date().toISOString()}`);
        
        const locationPromise = getApproximateLocation()
          .then((location) => {
            const locationDuration = performance.now() - locationStartTime;
            console.log(`[PERF] ✅ [useHomeScreen] END location fetch | duration: ${locationDuration.toFixed(2)}ms | location:`, location, `| timestamp: ${new Date().toISOString()}`);
            return {
              label: formatLocationForAi(location),
              latitude: location?.latitude,
              longitude: location?.longitude,
            };
          })
          .catch((e) => {
            const locationDuration = performance.now() - locationStartTime;
            console.log(`[PERF] ❌ [useHomeScreen] ERROR location fetch | duration: ${locationDuration.toFixed(2)}ms | error: ${e.message} | timestamp: ${new Date().toISOString()}`);
            return { label: null, latitude: undefined, longitude: undefined };
          });

        console.log('[useHomeScreen] 🚀 Wysyłam do AI...');

        const locationData = await locationPromise;
        const aiStartTime = performance.now();
        console.log(`[PERF] 🤖 [useHomeScreen] START AI processing | location: ${locationData.label ? 'provided' : 'none'} | lat: ${locationData.latitude} | lng: ${locationData.longitude} | timestamp: ${new Date().toISOString()}`);
        
        const result = await voiceAiMutation.mutateAsync({
          uri,
          options: { 
            language: 'pl',
            location: locationData.label || undefined,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          },
        });
        
        const aiDuration = performance.now() - aiStartTime;
        const totalHookDuration = performance.now() - hookStartTime;
        console.log(`[PERF] ✅ [useHomeScreen] END AI processing | AI duration: ${aiDuration.toFixed(2)}ms | total hook duration: ${totalHookDuration.toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);
        console.log('[useHomeScreen] ✅ Odpowiedź z AI:', result);

        setMessages((prev) => 
          prev.map(msg => 
            msg.id === userMessageId 
              ? { ...msg, content: result.transcript }
              : msg
          )
        );

        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: result.reply, 
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        setIsTyping(false);
        speak(result.reply);

        if (result.emailIntent?.shouldSendEmail) {
          console.log('[useHomeScreen] 📧 Wykryto intencję wysłania emaila:', result.emailIntent);
          setEmailIntent(result.emailIntent);
        }

        if (result.calendarIntent?.shouldCreateEvent) {
          console.log('[useHomeScreen] 📅 Wykryto intencję dodania wydarzenia:', result.calendarIntent);
          setCalendarIntent(result.calendarIntent);
        } else {
          console.log('[useHomeScreen] 📅 Brak intencji kalendarza lub shouldCreateEvent = false:', result.calendarIntent);
        }

        if (result.smsIntent?.shouldSendSms) {
          console.log('[useHomeScreen] 📱 Wykryto intencję wysłania SMS:', result.smsIntent);
          setSmsIntent(result.smsIntent);

          const smsBody =
            result.smsIntent.body && result.smsIntent.body.trim().length > 0
              ? result.smsIntent.body
              : '';

          const isProbablyPhoneNumber =
            typeof result.smsIntent.to === 'string' &&
            /\d/.test(result.smsIntent.to);

          const recipients =
            result.smsIntent.to && isProbablyPhoneNumber
              ? [result.smsIntent.to]
              : [];

          console.log('[useHomeScreen] 📱 SMS details - recipients:', recipients, 'body:', smsBody);

          // SMS w tle - nie blokuj UI
          SMS.isAvailableAsync().then((available: boolean) => {
            console.log('[useHomeScreen] 📱 SMS available:', available);
            if (available) {
              SMS.sendSMSAsync(recipients, smsBody)
                .then(() => console.log('[useHomeScreen] ✅ SMS sent successfully'))
                .catch((e: unknown) => console.error('[useHomeScreen] ❌ SMS error:', e));
            } else {
              console.error('[useHomeScreen] ❌ SMS not available on this device');
            }
          }).catch((e: unknown) => console.error('[useHomeScreen] ❌ SMS availability check error:', e));
        } else {
          console.log('[useHomeScreen] 📱 Brak intencji SMS lub shouldSendSms = false:', result.smsIntent);
        }
        
        // Zapis czatu w TLE - nie blokuj odpowiedzi!
        (async () => {
          try {
            const { createNewChat } = await import('../../../services/chats.service');
            const chatId = await createNewChat().then((res) => res.chatId).catch(() => null);
            if (chatId) {
              await Promise.all([
                apiClient.post(`/ai/chats/${chatId}/messages`, { role: 'user', content: result.transcript }),
                apiClient.post(`/ai/chats/${chatId}/messages`, { role: 'assistant', content: result.reply }),
              ]).catch(() => {});
            }
            queryClient.invalidateQueries({ queryKey: ['chats'] });
          } catch {
            // Ignoruj błędy zapisu - nie blokuj UI
          }
        })();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Coś poszło nie tak po stronie AI.',
        );
        setIsTyping(false);
        
        setMessages((prev) => 
          prev.map((msg, idx, arr) => 
            idx === arr.length - 1 && msg.role === 'user'
              ? { ...msg, content: 'Błąd przetwarzania mowy' }
              : msg
          )
        );
      }
    },
  });

  const handleTypingComplete = useCallback(() => {
    setIsTyping(false);
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      setMessages([]);
      setError(null);
      setIsTyping(false);
      stopTTS();
      
      const { createNewChat } = await import('../../../services/chats.service');
      await createNewChat();

      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (err) {
      console.error('Error creating new chat:', err);
      setError(
        err instanceof Error ? err.message : 'Nie udało się utworzyć nowego chatu',
      );
    }
  }, [stopTTS, queryClient]);

  const clearEmailIntent = useCallback(() => {
    setEmailIntent(null);
  }, []);

  const clearCalendarIntent = useCallback(() => {
    setCalendarIntent(null);
  }, []);

  const clearSmsIntent = useCallback(() => {
    setSmsIntent(null);
  }, []);

  return {
    user,
    isDrawerOpen,
    setIsDrawerOpen,
    voiceState,
    startListening,
    stopListening,
    messages,
    isLoading: voiceAiMutation.isPending,
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
    smsIntent,
    clearSmsIntent,
  };
};