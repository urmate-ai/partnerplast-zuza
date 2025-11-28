import React from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import type { RegisterStep } from '../../shared/hooks/useRegisterScreen.hook';
import { NameStep } from './NameStep.component';
import { EmailStep } from './EmailStep.component';
import { PasswordStep } from './PasswordStep.component';

type RegisterFormProps = {
  control: Control<Record<string, string>>;
  errors: FieldErrors<Record<string, string>>;
  currentStep: RegisterStep;
  onNext: () => void;
  isLoading: boolean;
  getButtonText: () => string;
  registerError?: string | null;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  control,
  errors,
  currentStep,
  onNext,
  isLoading,
  getButtonText,
  registerError,
}) => {
  const buttonText = getButtonText();

  switch (currentStep) {
    case 'name':
      return (
        <NameStep
          control={control as Control<Record<string, string>>}
          errors={errors as FieldErrors<Record<string, string>>}
          onNext={onNext}
          isLoading={isLoading}
          buttonText={buttonText}
        />
      );
    case 'email':
  return (
        <EmailStep
          control={control as Control<Record<string, string>>}
          errors={errors as FieldErrors<Record<string, string>>}
          onNext={onNext}
          isLoading={isLoading}
          buttonText={buttonText}
        />
      );
    case 'password':
      return (
        <PasswordStep
          control={control as Control<Record<string, string>>}
          errors={errors as FieldErrors<Record<string, string>>}
          onNext={onNext}
          isLoading={isLoading}
          buttonText={buttonText}
          registerError={registerError}
        />
  );
    default:
      return null;
  }
};

