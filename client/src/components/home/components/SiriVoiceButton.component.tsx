import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { View } from '../../../shared/components/View.component';
import { Text } from '../../../shared/components/Text.component';

interface SiriVoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onPress: () => void;
}

export const SiriVoiceButton: React.FC<SiriVoiceButtonProps> = ({
  isListening,
  isProcessing,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getButtonText = () => {
    if (isProcessing) return 'Przetwarzam...';
    if (isListening) return 'Słucham...';
    return 'Naciśnij, aby mówić';
  };

  const getButtonColor = () => {
    return '#000000';
  };

  const getButtonTextColor = () => {
    return '#FFFFFF';
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: getButtonColor(),
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        {isListening && (
          <View style={styles.waveContainer}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.wave,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.3, 0.8],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        )}
        <Text style={[styles.text, { color: getButtonTextColor() }]}>
          {getButtonText()}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  waveContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});

