import React from 'react';
import { Animated, View as RNView } from 'react-native';
import { useTypingDots } from '../hooks/useTypingDots.hook';

interface TypingIndicatorProps {
  isVisible: boolean;
}

const DOT_SIZE = 8;
const DOT_COLOR = '#6B7280';

function AnimatedDot({
  style,
}: {
  animatedValue: Animated.Value;
  style: { opacity: Animated.AnimatedInterpolation<number>; transform: Array<{ scale: Animated.AnimatedInterpolation<number> }> };
}) {
  return (
    <Animated.View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: DOT_COLOR,
        ...style,
      }}
    />
  );
}

export function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  const { dots, getDotStyle } = useTypingDots(isVisible);

  if (!isVisible) return null;

  return (
    <RNView 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      {dots.map((dot, index) => (
        <AnimatedDot key={index} animatedValue={dot} style={getDotStyle(dot)} />
      ))}
    </RNView>
  );
}
