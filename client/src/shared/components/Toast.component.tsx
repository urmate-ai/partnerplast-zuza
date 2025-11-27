import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, Dimensions } from 'react-native';
import { View } from './View.component';
import { Text } from './Text.component';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

export type ToastConfig = {
  type: ToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
};

type ToastState = {
  visible: boolean;
  config: ToastConfig | null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Global toast ref
let toastRef: { showToast: (config: ToastConfig) => void } | null = null;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    config: null,
  });
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = React.useCallback((config: ToastConfig) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToastState({ visible: true, config });

    // Reset animations
    slideAnim.setValue(-100);
    opacityAnim.setValue(0);

    // Animate in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after visibilityTime
    const visibilityTime = config.visibilityTime || 3000;
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, visibilityTime);
  }, [slideAnim, opacityAnim, hideToast]);

  const hideToast = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastState({ visible: false, config: null });
    });
  }, [slideAnim, opacityAnim]);

  // Set global ref
  useEffect(() => {
    toastRef = { showToast };
    return () => {
      toastRef = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showToast]);

  const getToastStyles = () => {
    switch (toastState.config?.type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          iconColor: '#10B981',
          iconName: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconColor: '#EF4444',
          iconName: 'close-circle' as const,
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconColor: '#3B82F6',
          iconName: 'information-circle' as const,
        };
    }
  };

  const styles = getToastStyles();

  return (
    <>
      {children}
      {toastState.visible && toastState.config && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            right: 16,
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
            zIndex: 9999,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={hideToast}
            className={`${styles.bg} ${styles.border} border rounded-xl px-4 py-3 shadow-lg`}
            style={{
              maxWidth: SCREEN_WIDTH - 32,
            }}
          >
            <View className="flex-row items-start">
              <Ionicons
                name={styles.iconName}
                size={24}
                color={styles.iconColor}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-0.5">
                  {toastState.config.text1}
                </Text>
                {toastState.config.text2 && (
                  <Text className="text-sm text-gray-600 mt-0.5">
                    {toastState.config.text2}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={hideToast}
                className="ml-2 p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
};

// Export helper function
export const showToast = (config: ToastConfig) => {
  if (toastRef) {
    toastRef.showToast(config);
  }
};

// Export hook for convenience
export const useToast = () => {
  return {
    showToast,
  };
};

