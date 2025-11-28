import React from 'react';
import { Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { Input } from '../shared/components/Input.component';
import { Button } from '../shared/components/Button.component';
import { LoadingSpinner } from '../shared/components/LoadingSpinner.component';
import { useForgotPasswordScreen } from '../shared/hooks/useForgotPasswordScreen.hook';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const {
    control,
    errors,
    handleSubmit,
    isLoading,
    isEmailSent,
    handleBackToLogin,
  } = useForgotPasswordScreen({ navigation });

  if (isEmailSent) {
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
                <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                  <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                </View>
                <Text variant="h1" className="text-center mb-4">
                  Email wysłany!
                </Text>
                <Text className="text-center text-gray-600 mb-2">
                  Jeśli konto z tym emailem istnieje, otrzymasz email z instrukcjami resetu hasła.
                </Text>
                <Text className="text-center text-gray-500 text-sm">
                  Sprawdź swoją skrzynkę pocztową i kliknij link w wiadomości.
                </Text>
              </View>

              <Button
                onPress={handleBackToLogin}
                variant="primary"
                size="lg"
              >
                Wróć do logowania
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-14">
          <Pressable
            onPress={handleBackToLogin}
            className="mb-8 self-start"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>

          <View className="flex-1 justify-center">
            <View className="w-full max-w-md mx-auto">
              <Text variant="h1" className="mb-4">
                Nie pamiętasz hasła?
              </Text>
              <Text className="text-gray-600 mb-8">
                Podaj adres email powiązany z Twoim kontem, a wyślemy Ci instrukcje resetu hasła.
              </Text>

              <View className="gap-4">
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Adres email"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      autoFocus
                      error={errors.email?.message}
                    />
                  )}
                />

                <Button
                  onPress={handleSubmit}
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner /> : 'Wyślij email'}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

