import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '../utils/cn';

type TextProps = RNTextProps & {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  className?: string;
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  className,
  children,
  ...props
}) => {
  const variantClasses = {
    h1: 'text-3xl font-bold text-gray-900',
    h2: 'text-2xl font-bold text-gray-900',
    h3: 'text-xl font-semibold text-gray-900',
    body: 'text-base text-gray-700',
    caption: 'text-sm text-gray-500',
    label: 'text-sm font-medium text-gray-600',
  };

  return (
    <RNText className={cn(variantClasses[variant], className)} {...(props as any)}>
      {children}
    </RNText>
  );
};

