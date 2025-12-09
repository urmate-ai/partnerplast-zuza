import React from 'react';
import { Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Controller } from 'react-hook-form';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { SafeAreaView } from '../../shared/components/SafeAreaView.component';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../../shared/components/Input.component';
import { Button } from '../../shared/components/Button.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import { SuccessScreen } from '../../components/auth/SuccessScreen.component';
import { useForgotPasswordScreen } from '../../shared/hooks/auth/useForgotPasswordScreen.hook';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const insets = useSafeAreaInsets();
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
      <SuccessScreen
        title="Email wysłany!"
        message="Jeśli konto z tym emailem istnieje, otrzymasz email z instrukcjami resetu hasła."
        description="Sprawdź swoją skrzynkę pocztową i kliknij link w wiadomości."
        onButtonPress={handleBackToLogin}
        buttonText="Wróć do logowania"
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingTop: Math.max(insets.top, 14),
            paddingBottom: Math.max(insets.bottom, 20),
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6">
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
    </SafeAreaView>
  );
};

