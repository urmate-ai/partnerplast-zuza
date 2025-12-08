import type { NativeScrollEvent } from 'react-native';

const SCROLL_THRESHOLD = 50;

export function isNearBottom(
  contentHeight: number,
  scrollY: number,
  layoutHeight: number,
): boolean {
  return contentHeight - scrollY - layoutHeight < SCROLL_THRESHOLD;
}

export function getScrollPosition(event: NativeScrollEvent): {
  isAtBottom: boolean;
} {
  const { contentOffset, contentSize, layoutMeasurement } = event;
  const isAtBottom = isNearBottom(
    contentSize.height,
    contentOffset.y,
    layoutMeasurement.height,
  );

  return { isAtBottom };
}

