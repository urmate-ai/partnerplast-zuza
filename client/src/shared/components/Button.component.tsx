import React from 'react';
import { Pressable } from 'react-native';
import { cn } from '../utils/cn';
import { View } from './View.component';
import { Text } from './Text.component';

type ButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
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
  const baseClasses = 'rounded-lg items-center justify-center';

  const variantClasses = {
    primary: 'bg-gray-900 active:opacity-85',
    secondary: 'bg-gray-100 active:opacity-85',
    outline: 'bg-transparent border border-gray-300 active:opacity-85',
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

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <View
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          disabled && 'opacity-50',
          className,
        )}
      >
        <Text className={cn(textVariantClasses[variant], textSizeClasses[size])}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
};

