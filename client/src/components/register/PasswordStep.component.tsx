import React, { useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Animated } from 'react-native';
import { View } from '../../shared/components/View.component';
import { Input } from '../../shared/components/Input.component';
import { Button } from '../../shared/components/Button.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import { ErrorText } from '../../shared/components/ErrorText.component';
import type { Control, FieldErrors } from 'react-hook-form';
import type { RegisterFormData } from '../../shared/types/form.types';

type PasswordStepProps = {
  control: Control<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  onNext: () => void;
  isLoading: boolean;
  buttonText: string;
  registerError?: string | null;
};

export const PasswordStep: React.FC<PasswordStepProps> = ({
  control,
  errors,
  onNext,
  isLoading,
  buttonText,
  registerError,
}) => {
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const animatedStyle = {
    transform: [
      { translateY },
    ],
  };

  return (
    <Animated.View style={animatedStyle}>
      <View className="gap-4">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Hasło (min. 6 znaków)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="default"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              secureTextEntry
              autoFocus
              error={errors.password?.message}
            />
          )}
        />

        {registerError && (
          <View className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <ErrorText message={registerError} className="text-center font-medium" />
          </View>
        )}

        <Button
          onPress={onNext}
          variant="primary"
          size="lg"
        >
          {isLoading ? <LoadingSpinner /> : buttonText}
        </Button>
      </View>
    </Animated.View>
  );
};

