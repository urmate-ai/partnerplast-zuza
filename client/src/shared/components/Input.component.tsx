import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { View } from './View.component';
import { Text } from './Text.component';
import { cn } from '../utils/cn';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  containerClassName,
  secureTextEntry,
  ...props
}) => {
  return (
    <View className={cn('mb-1', containerClassName)}>
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'border border-gray-200 rounded-xl px-4 py-3.5 bg-white',
          error && 'border-red-500',
          className,
        )}
      >
        <TextInput
          {...props}
          style={styles.textInput}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
        />
      </View>
      {error && (
        <Text className="text-xs text-red-500 mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
});

