import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { View as CustomView } from '../../../shared/components/View.component';

type TypingIndicatorProps = {
  isVisible: boolean;
};

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVisible) {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
      return;
    }

    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 200);
    const anim3 = animateDot(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [isVisible, dot1, dot2, dot3]);

  if (!isVisible) return null;

  const dotSize = 8;
  const dotOpacity = (dot: Animated.Value) =>
    dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

  const dotScale = (dot: Animated.Value) =>
    dot.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

  return (
    <CustomView className="flex-row items-center gap-1.5 px-4 py-3">
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: '#6B7280',
          opacity: dotOpacity(dot1),
          transform: [{ scale: dotScale(dot1) }],
        }}
      />
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: '#6B7280',
          opacity: dotOpacity(dot2),
          transform: [{ scale: dotScale(dot2) }],
        }}
      />
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: '#6B7280',
          opacity: dotOpacity(dot3),
          transform: [{ scale: dotScale(dot3) }],
        }}
      />
    </CustomView>
  );
};


