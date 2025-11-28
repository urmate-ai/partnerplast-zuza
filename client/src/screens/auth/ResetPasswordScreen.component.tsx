import React from 'react';
import { Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Controller } from 'react-hook-form';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { PasswordInput } from '../../shared/components/PasswordInput.component';
import { Button } from '../../shared/components/Button.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import { SuccessScreen } from '../../components/auth/SuccessScreen.component';
import { ErrorScreen } from '../../components/auth/ErrorScreen.component';
import { useResetPasswordScreen } from '../../shared/hooks/auth/useResetPasswordScreen.hook';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';

type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const token = route.params?.token || '';

  const {
    control,
    errors,
    handleSubmit,
    isLoading,
    isSuccess,
    handleBackToLogin,
  } = useResetPasswordScreen({ token });

  if (!token) {
    return (
      <ErrorScreen
        title="Nieprawidłowy link"
        message="Link resetu hasła jest nieprawidłowy lub wygasł."
        onButtonPress={handleBackToLogin}
        buttonText="Wróć do logowania"
      />
    );
  }

  if (isSuccess) {
    return (
      <SuccessScreen
        title="Hasło zresetowane!"
        message="Twoje hasło zostało pomyślnie zresetowane."
        description="Zostaniesz przekierowany do ekranu logowania..."
        onButtonPress={handleBackToLogin}
        buttonText="Wróć do logowania"
      />
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
                Resetuj hasło
              </Text>
              <Text className="text-gray-600 mb-8">
                Wprowadź nowe hasło dla swojego konta.
              </Text>

              <View className="gap-4">
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordInput
                      label="Nowe hasło"
                      placeholder="Nowe hasło (min. 6 znaków)"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      autoCorrect={false}
                      autoFocus
                      error={errors.newPassword?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordInput
                      label="Potwierdź hasło"
                      placeholder="Potwierdź hasło"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      autoComplete="password-new"
                      autoCorrect={false}
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />

                <Button
                  onPress={handleSubmit}
                  variant="primary"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner /> : 'Zresetuj hasło'}
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

