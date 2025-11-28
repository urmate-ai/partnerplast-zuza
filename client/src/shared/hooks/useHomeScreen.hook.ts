import { useState, useCallback } from 'react';
import { useVoiceListener } from '../../hooks/useVoiceListener.hook';
import { useTextToSpeech } from '../../hooks/useTextToSpeech.hook';
import { useVoiceAi } from './useVoiceAi.hook';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export const useHomeScreen = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const voiceAiMutation = useVoiceAi();
  const { state: ttsState, speak, stop: stopTTS } = useTextToSpeech();

  const [voiceState, startListening, stopListening] = useVoiceListener({
    autoStart: false,
    onStop: async (uri) => {
      if (!uri || !user?.id) return;
      setError(null);
      
      try {
        setIsTyping(true);

        const result = await voiceAiMutation.mutateAsync({
          uri,
          options: { language: 'pl' },
        });

        const userMessageId = `user-${Date.now()}`;
        const userMessage: Message = {
          id: userMessageId,
          role: 'user',
          content: result.transcript,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: result.reply, 
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        speak(result.reply);

        queryClient.invalidateQueries({ queryKey: ['chats'] });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Coś poszło nie tak po stronie AI.',
        );
        setIsTyping(false);
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
      
      const { createNewChat } = await import('../../services/chats.service');
      await createNewChat();

      queryClient.invalidateQueries({ queryKey: ['chats'] });
    } catch (err) {
      console.error('Error creating new chat:', err);
      setError(
        err instanceof Error ? err.message : 'Nie udało się utworzyć nowego chatu',
      );
    }
  }, [stopTTS, queryClient]);

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
  };
};

