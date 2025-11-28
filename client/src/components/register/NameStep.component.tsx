import React, { useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Animated } from 'react-native';
import { View } from '../../shared/components/View.component';
import { Input } from '../../shared/components/Input.component';
import { Button } from '../../shared/components/Button.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import type { Control, FieldErrors } from 'react-hook-form';
import type { RegisterFormData } from '../../shared/types/form.types';

type NameStepProps = {
  control: Control<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
  onNext: () => void;
  isLoading: boolean;
  buttonText: string;
};

export const NameStep: React.FC<NameStepProps> = ({
  control,
  errors,
  onNext,
  isLoading,
  buttonText,
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
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Twoje imię"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="default"
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              autoFocus
              error={errors.name?.message}
            />
          )}
        />

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

