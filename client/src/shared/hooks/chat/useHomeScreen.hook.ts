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
import type { Message, ProcessingStatus } from '../../../components/home/types/message.types';

export const useHomeScreen = () => {
  const { user, isAuthenticated, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStatus, setCurrentStatus] = useState<ProcessingStatus | null>(null);
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
      if (!uri || !user?.id || !isAuthenticated || !token) {
        console.warn('[useHomeScreen] ⚠️ Próba użycia bez autoryzacji - brak user, token lub isAuthenticated');
        return;
      }
      setError(null);
      
      try {
        const userMessageId = `user-${Date.now()}`;
        const userMessage: Message = {
          id: userMessageId,
          role: 'user',
          content: 'Przetwarzanie mowy...',
          timestamp: new Date(),
        };  
        setMessages([userMessage]);
        setCurrentStatus('transcribing');

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
        
        const handleTranscript = (transcript: string) => {
          console.log('[useHomeScreen] 📝 Transkrypcja otrzymana, aktualizuję wiadomość:', transcript);
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === userMessageId 
                ? { ...msg, content: transcript }
                : msg
            )
          );
          if (currentStatus === 'transcribing') {
            setCurrentStatus(null);
          }
        };
        
        
        const handleStatusChange = (status: ProcessingStatus) => {
          console.log('[useHomeScreen] 🔄 Zmiana statusu:', status);
          setCurrentStatus(status);
          
          if (status === null) {
            return;
          }
          
          setIsTyping(false);
        };
        
        const result = await voiceAiMutation.mutateAsync({
          uri,
          options: { 
            language: 'pl',
            location: locationData.label || undefined,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            onTranscript: handleTranscript,
            onStatusChange: handleStatusChange, 
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

        setCurrentStatus(null);
        
        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: result.reply, 
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const userMsg = prev.find(msg => msg.role === 'user');
          return userMsg ? [userMsg, assistantMessage] : [assistantMessage];
        });

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
            /\d/.test(result.smsIntent.to) &&
            !/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(result.smsIntent.to); 

          let recipients: string[] = [];

          if (result.smsIntent.to) {
            if (isProbablyPhoneNumber) {
              recipients = [result.smsIntent.to];
            } else {
              console.log('[useHomeScreen] 📱 Szukam kontaktu dla:', result.smsIntent.to);
              try {
                const { findContactByName } = await import('../../../services/contacts.service');
                const contact = await findContactByName(result.smsIntent.to);
                
                if (contact && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                  const phoneNumber = contact.phoneNumbers[0].number;
                  recipients = [phoneNumber];
                  console.log('[useHomeScreen] ✅ Znaleziono kontakt:', contact.name, 'numer:', phoneNumber);
                } else {
                  console.log('[useHomeScreen] ⚠️ Nie znaleziono kontaktu lub brak numeru telefonu dla:', result.smsIntent.to);
                }
              } catch (error) {
                console.error('[useHomeScreen] ❌ Błąd podczas wyszukiwania kontaktu:', error);
              }
            }
          }

          console.log('[useHomeScreen] 📱 SMS details - recipients:', recipients, 'body:', smsBody);

          if (recipients.length > 0) {
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
            console.log('[useHomeScreen] ⚠️ Brak odbiorcy SMS - nie można wysłać');
          }
        } else {
          console.log('[useHomeScreen] 📱 Brak intencji SMS lub shouldSendSms = false:', result.smsIntent);
        }
        
        // Zapisz chat do historii używając aktualnego chatu (nie tworzy nowego za każdym razem)
        // Sprawdź autoryzację przed zapisaniem
        if (isAuthenticated && token && user?.id) {
          (async () => {
            try {
              const { saveChat } = await import('../../../services/chats.service');
              await saveChat(result.transcript, result.reply);
              console.log('[useHomeScreen] ✅ Chat zapisany do historii');
              queryClient.invalidateQueries({ queryKey: ['chats'] });
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              const isAuthError = errorMessage.includes('401') || errorMessage.includes('Unauthorized');
              
              if (isAuthError) {
                console.warn('[useHomeScreen] ⚠️ Błąd autoryzacji podczas zapisywania chatu - użytkownik nie jest zalogowany');
                // Można tutaj wywołać logout lub odświeżyć token
              } else {
                console.error('[useHomeScreen] ❌ Błąd podczas zapisywania chatu:', errorMessage);
              }
              // Nie pokazujemy błędu użytkownikowi, bo to nie jest krytyczne
            }
          })();
        } else {
          console.warn('[useHomeScreen] ⚠️ Pominięto zapis chatu - brak autoryzacji (isAuthenticated:', isAuthenticated, ', token:', !!token, ', user:', !!user?.id, ')');
        }
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
      setCurrentStatus(null);
      setError(null);
      setIsTyping(false);
      stopTTS();
      
      // Sprawdź autoryzację przed utworzeniem nowego chatu
      if (!isAuthenticated || !token || !user?.id) {
        console.warn('[useHomeScreen] ⚠️ Próba utworzenia nowego chatu bez autoryzacji');
        setError('Musisz być zalogowany, aby utworzyć nowy czat');
        return;
      }
      
      const { createNewChat } = await import('../../../services/chats.service');
      await createNewChat();
      console.log('[useHomeScreen] ✅ Nowy chat utworzony');

      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isAuthError = errorMessage.includes('401') || errorMessage.includes('Unauthorized');
      
      if (isAuthError) {
        console.warn('[useHomeScreen] ⚠️ Błąd autoryzacji podczas tworzenia nowego chatu');
        setError('Musisz być zalogowany, aby utworzyć nowy czat');
      } else {
        console.error('[useHomeScreen] ❌ Błąd podczas tworzenia nowego chatu:', errorMessage);
        setError(
          err instanceof Error ? err.message : 'Nie udało się utworzyć nowego chatu',
        );
      }
    }
  }, [stopTTS, queryClient, isAuthenticated, token, user?.id]);

  const clearEmailIntent = useCallback(() => {
    setEmailIntent(null);
  }, []);

  const clearCalendarIntent = useCallback(() => {
    setCalendarIntent(null);
  }, []);

  const clearSmsIntent = useCallback(() => {
    setSmsIntent(null);
  }, []);

  const lastUserMessage = messages.find(msg => msg.role === 'user') || null;
  const lastAssistantMessage = messages.find(msg => msg.role === 'assistant' && !msg.status) || null;

  return {
    user,
    isDrawerOpen,
    setIsDrawerOpen,
    voiceState,
    startListening,
    stopListening,
    messages,
    lastUserMessage,
    lastAssistantMessage,
    currentStatus,
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