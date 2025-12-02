import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const DOT_COUNT = 3;
const ANIMATION_DURATION = 400;
const DOT_DELAYS = [0, 200, 400];

export function useTypingDots(isVisible: boolean) {
  const dots = useRef(
    Array.from({ length: DOT_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!isVisible) {
      dots.forEach((dot) => dot.setValue(0));
      return;
    }

    const animations = dots.map((dot, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(DOT_DELAYS[index]),
          Animated.timing(dot, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isVisible, dots]);

  const getDotStyle = (dot: Animated.Value) => {
    const opacity = dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    const scale = dot.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    return { opacity, transform: [{ scale }] };
  };

  return { dots, getDotStyle };
}

