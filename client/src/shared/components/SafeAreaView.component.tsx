import React from 'react';
import { SafeAreaView as RNSafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { cn } from '../utils/cn';

type SafeAreaViewComponentProps = SafeAreaViewProps & {
  className?: string;
};

export const SafeAreaView: React.FC<SafeAreaViewComponentProps> = ({ 
  className, 
  children,
  ...props 
}) => {
  return (
    <RNSafeAreaView className={cn(className)} {...props}>
      {children}
    </RNSafeAreaView>
  );
};

