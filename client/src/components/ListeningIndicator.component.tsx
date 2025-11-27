import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { View } from '../shared/components/View.component';

type ListeningIndicatorProps = {
  isListening: boolean;
};

export const ListeningIndicator: React.FC<ListeningIndicatorProps> = ({
  isListening,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!isListening) {
      scale.stopAnimation();
      opacity.stopAnimation();
      scale.setValue(1);
      opacity.setValue(0.4);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [isListening, opacity, scale]);

  return (
    <View className="items-center justify-center py-2">
      <Animated.View
        className="absolute w-[52px] h-[52px] rounded-[26px] bg-blue-500/20"
        style={{
          transform: [{ scale }],
          opacity,
        }}
      />
      <View className="w-10 h-10 rounded-full bg-blue-600" />
    </View>
  );
};
