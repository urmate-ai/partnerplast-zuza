import { useRef, useCallback, useEffect } from 'react';
import type { ScrollView } from 'react-native';
import { getScrollPosition } from '../utils/scroll.utils';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface UseAutoScrollOptions {
  messagesCount: number;
  displayedText?: string;
  isTyping?: boolean;
}

export function useAutoScroll({
  messagesCount,
  displayedText,
  isTyping,
}: UseAutoScrollOptions) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const shouldScrollToEndRef = useRef<boolean>(true);

  const scrollToEnd = useCallback((animated = true, force = false) => {
    if (scrollViewRef.current && (shouldScrollToEndRef.current || force)) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { isAtBottom } = getScrollPosition(event.nativeEvent);
      shouldScrollToEndRef.current = isAtBottom;
    },
    [],
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { isAtBottom } = getScrollPosition(event.nativeEvent);
      shouldScrollToEndRef.current = isAtBottom;
    },
    [],
  );

  const handleContentSizeChange = useCallback(() => {
    scrollToEnd();
  }, [scrollToEnd]);

  const handleLayout = useCallback(() => {
    scrollToEnd();
  }, [scrollToEnd]);

  useEffect(() => {
    scrollToEnd(true, true);
  }, [messagesCount, scrollToEnd]);

  useEffect(() => {
    if (displayedText) {
      scrollToEnd(false, true);
    }
  }, [displayedText, scrollToEnd]);

  useEffect(() => {
    if (!isTyping && displayedText) {
      scrollToEnd(true, true);
    }
  }, [isTyping, displayedText, scrollToEnd]);

  return {
    scrollViewRef,
    scrollToEnd,
    handleScroll,
    handleMomentumScrollEnd,
    handleContentSizeChange,
    handleLayout,
  };
}

