import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { Button } from '../../shared/components/Button.component';

type ErrorScreenProps = {
  title: string;
  message: string;
  onButtonPress: () => void;
  buttonText: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
};

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title,
  message,
  onButtonPress,
  buttonText,
  icon = 'close-circle',
  iconColor = '#ef4444',
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center items-center px-6 pt-14">
          <View className="w-full max-w-md">
            <View className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4"
                style={{ backgroundColor: `${iconColor}20` }}
              >
                <Ionicons name={icon} size={48} color={iconColor} />
              </View>
              <Text variant="h1" className="text-center mb-4">
                {title}
              </Text>
              <Text className="text-center text-gray-600 mb-2">{message}</Text>
            </View>

            <Button onPress={onButtonPress} variant="primary" size="lg">
              {buttonText}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

