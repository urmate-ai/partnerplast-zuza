import React from 'react';
import { Controller } from 'react-hook-form';
import { View } from '../../shared/components/View.component';
import { Input } from '../../shared/components/Input.component';
import { Button } from '../../shared/components/Button.component';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner.component';
import type { Control, FieldErrors } from 'react-hook-form';
import type { RegisterStep } from '../../shared/hooks/useRegisterScreen.hook';

type RegisterFormProps = {
  control: Control<any>;
  errors: FieldErrors<any>;
  currentStep: RegisterStep;
  getStepPlaceholder: () => string;
  onNext: () => void;
  isLoading: boolean;
  getButtonText: () => string;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  control,
  errors,
  currentStep,
  getStepPlaceholder,
  onNext,
  isLoading,
  getButtonText,
}) => {
  return (
    <View className="gap-4">
      <Controller
        control={control}
        name={currentStep}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder={getStepPlaceholder()}
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={currentStep === 'email' ? 'email-address' : 'default'}
            autoCapitalize={currentStep === 'name' ? 'words' : 'none'}
            autoComplete={
              currentStep === 'name'
                ? 'name'
                : currentStep === 'email'
                ? 'email'
                : 'password'
            }
            autoCorrect={false}
            secureTextEntry={currentStep === 'password'}
            autoFocus
            error={errors[currentStep]?.message as string}
          />
        )}
      />

      <Button
        onPress={onNext}
        variant="primary"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner /> : getButtonText()}
      </Button>
    </View>
  );
};

