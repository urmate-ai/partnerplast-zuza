import React from 'react';
import { Text } from './Text.component';
import { cn } from '../utils/cn';

type ErrorTextProps = {
  message: string;
  className?: string;
};

export const ErrorText: React.FC<ErrorTextProps> = ({ message, className }) => {
  return (
    <Text className={cn('text-red-600 text-sm', className)}>
      {message}
    </Text>
  );
};

