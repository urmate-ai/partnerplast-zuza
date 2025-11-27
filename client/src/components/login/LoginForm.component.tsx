import React from 'react';
import { Controller } from 'react-hook-form';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { Input } from '../../shared/components/Input.component';
import { Button } from '../../shared/components/Button.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import { ErrorText } from '../../shared/components/ErrorText.component';
import type { Control, FieldErrors } from 'react-hook-form';

type LoginFormData = {
  email: string;
  password: string;
};

type LoginFormProps = {
  control: Control<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  showPassword: boolean;
  onTogglePassword: () => void;
  emailSubmitted: boolean;
  onEmailSubmit: () => void;
  onPasswordSubmit: (data: LoginFormData) => void;
  isLoading: boolean;
  loginError: string | null;
  getValues: () => LoginFormData;
  onEmailChange: () => void;
  onEmailChangeRequest?: () => void;
};

export const LoginForm: React.FC<LoginFormProps> = ({
  control,
  errors,
  showPassword,
  onTogglePassword,
  emailSubmitted,
  onEmailSubmit,
  onPasswordSubmit,
  isLoading,
  loginError,
  getValues,
  onEmailChange,
  onEmailChangeRequest,
}) => {
  if (!emailSubmitted) {
    return (
      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Adres email"
              value={value}
              onChangeText={(text) => {
                onChange(text);
                onEmailChange();
              }}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          onPress={onEmailSubmit}
          variant="primary"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Kontynuuj'}
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="mb-4">
        <Text variant="label" className="mb-2">
          Email
        </Text>
        <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
          <Text className="flex-1 text-base text-gray-900">
            {getValues().email}
          </Text>
          <Pressable onPress={onEmailChangeRequest}>
            <Text className="px-3 py-1.5 text-sm font-semibold text-gray-900">
              Zmień
            </Text>
          </Pressable>
        </View>
      </View>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text variant="label" className="mb-2">
              Hasło
            </Text>
            <View className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white">
              <Input
                placeholder="Hasło"
                value={value}
                onChangeText={(text) => {
                  onChange(text);
                  onEmailChange();
                }}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                className="flex-1 border-0"
                error={errors.password?.message}
              />
              <Pressable onPress={onTogglePassword} className="px-7 py-3.5">
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </View>
        )}
      />

      {loginError && (
        <View className="rounded-lg border border-red-200 bg-red-50 p-3">
          <ErrorText message={loginError} className="text-center font-medium" />
        </View>
      )}

      <Button
        onPress={() => onPasswordSubmit(getValues())}
        variant="primary"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner /> : 'Zaloguj się'}
      </Button>
    </View>
  );
};

