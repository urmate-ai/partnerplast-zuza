import React from 'react';
import { View as RNView, ViewProps as RNViewProps } from 'react-native';
import { cn } from '../utils/cn';

type ViewProps = RNViewProps & {
  className?: string;
};

export const View: React.FC<ViewProps> = ({ className, ...props }) => {
  return <RNView className={cn(className)} {...(props as RNViewProps)} />;
};

