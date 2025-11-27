import React, { useState } from 'react';
import { Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from './View.component';
import { Text } from './Text.component';
import { cn } from '../utils/cn';
import type { TextInputProps } from 'react-native';

type PasswordInputProps = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  containerClassName,
  value,
  onChangeText,
  onBlur,
  placeholder,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  ...textInputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && (
        <Text variant="label" className="mb-2">
          {label}
        </Text>
      )}
      <View className="flex-row items-center">
        <View
          className={cn(
            'flex-1 border border-gray-200 rounded-xl px-4 py-3.5 bg-white',
            error && 'border-red-500',
          )}
        >
          <TextInput
            {...textInputProps}
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            onBlur={onBlur}
            secureTextEntry={!showPassword}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
          />
        </View>
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="ml-2 p-2"
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#6B7280"
          />
        </Pressable>
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

