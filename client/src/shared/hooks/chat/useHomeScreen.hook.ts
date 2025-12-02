import { useState, useCallback } from 'react';
import * as SMS from 'expo-sms';
import { useVoiceListener } from '../../../hooks/useVoiceListener.hook';
import { useTextToSpeech } from '../../../hooks/useTextToSpeech.hook';
import { useVoiceAi } from './useVoiceAi.hook';
import { useAuthStore } from '../../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { getApproximateLocation, formatLocationForAi } from '../../utils/location.utils';
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

        console.log('[useHomeScreen] 📍 Pobieram lokalizację przed wysłaniem do AI...');
        const location = await getApproximateLocation();
        console.log('[useHomeScreen] 📍 Pobrana lokalizacja:', location);
        
        const locationLabel = formatLocationForAi(location);
        console.log('[useHomeScreen] 📍 Lokalizacja dla AI:', locationLabel);

        console.log('[useHomeScreen] 🚀 Wysyłam do AI z opcjami:', {
          language: 'pl',
          location: locationLabel,
        });

        const result = await voiceAiMutation.mutateAsync({
          uri,
          options: { language: 'pl', location: locationLabel },
        });

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

          try {
            const isSmsAvailable = await SMS.isAvailableAsync();
            if (!isSmsAvailable) {
              console.error('[useHomeScreen] ❌ SMS nie jest dostępny na tym urządzeniu');
            } else {
              console.log('[useHomeScreen] 📱 Otwieranie aplikacji SMS z odbiorcą:', recipients, 'i treścią:', smsBody);
              await SMS.sendSMSAsync(recipients, smsBody);
            }
          } catch (smsError) {
            console.error('[useHomeScreen] ❌ Błąd przy otwieraniu aplikacji SMS:', smsError);
          }
        }

        queryClient.invalidateQueries({ queryKey: ['chats'] });
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