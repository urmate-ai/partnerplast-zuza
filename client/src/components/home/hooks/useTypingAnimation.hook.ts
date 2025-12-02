import { useState, useEffect, useRef, useMemo } from 'react';
import type { Message } from '../types/message.types';

interface UseTypingAnimationOptions {
  message: Message | undefined;
  isTyping: boolean;
  onTypingComplete?: () => void;
}

const TYPING_INTERVAL_MS = 20;
const TYPING_COMPLETE_DELAY_MS = 100;

function getCharIncrement(char: string): number {
  if (char === ' ') return 2;
  if (/[.,!?;:]/.test(char)) return 0.5;
  return 1;
}

export function useTypingAnimation({
  message,
  isTyping,
  onTypingComplete,
}: UseTypingAnimationOptions) {
  const [displayedText, setDisplayedText] = useState<string>('');
  const typingMessageIdRef = useRef<string | null>(null);

  const shouldAnimate = useMemo(
    () => isTyping && message?.content && message.id,
    [isTyping, message?.content, message?.id],
  );

  useEffect(() => {
    if (isTyping && message?.id) {
      const currentMessageId = message.id;
      if (typingMessageIdRef.current !== currentMessageId) {
        typingMessageIdRef.current = currentMessageId;
        setDisplayedText('');
      }
    } else if (!isTyping) {
      typingMessageIdRef.current = null;
    }
  }, [isTyping, message?.id]);

  useEffect(() => {
    if (!shouldAnimate || !message?.content || !message.id) {
      if (message?.content && !isTyping) {
        setDisplayedText(message.content);
      }
      return;
    }

    const messageId = message.id;
    const fullText = message.content;

    if (typingMessageIdRef.current !== messageId) {
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');

    const typingInterval = setInterval(() => {
      if (typingMessageIdRef.current !== messageId) {
        clearInterval(typingInterval);
        return;
      }

      if (currentIndex < fullText.length) {
        const charIndex = Math.floor(currentIndex);
        const char = charIndex < fullText.length ? fullText[charIndex] : '';
        const increment = getCharIncrement(char);
        currentIndex += increment;
        const displayText = fullText.substring(
          0,
          Math.min(Math.floor(currentIndex), fullText.length),
        );
        setDisplayedText(displayText);
      } else {
        clearInterval(typingInterval);
        setDisplayedText(fullText);
        if (onTypingComplete && typingMessageIdRef.current === messageId) {
          setTimeout(() => onTypingComplete(), TYPING_COMPLETE_DELAY_MS);
        }
      }
    }, TYPING_INTERVAL_MS);

    return () => clearInterval(typingInterval);
  }, [shouldAnimate, message?.id, message?.content, isTyping, onTypingComplete]);

  return {
    displayedText,
    isAnimating: shouldAnimate && displayedText.length < (message?.content.length ?? 0),
    typingMessageId: typingMessageIdRef.current,
  };
}

