import React from 'react';
import { TouchableOpacity } from 'react-native';
import { View } from './View.component';
import { Text } from './Text.component';
import { cn } from '../utils/cn';

type ButtonProps = {
  children: React.ReactNode;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
}) => {
  const baseClasses = 'rounded-lg items-center justify-center flex-row';

  const variantClasses = {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-100',
    outline: 'bg-transparent border border-gray-300',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3',
  };

  const textVariantClasses = {
    primary: 'text-white font-semibold',
    secondary: 'text-gray-900 font-medium',
    outline: 'text-gray-900 font-medium',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.85}
      style={disabled && { opacity: 0.5 }}
    >
      <View
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
      >
        <Text className={cn(textVariantClasses[variant], textSizeClasses[size])}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

