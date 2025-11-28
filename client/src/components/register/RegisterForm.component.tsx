import React from 'react';
import type { Control, FieldErrors } from 'react-hook-form';
import type { RegisterStep } from '../../shared/hooks/auth/useRegisterScreen.hook';
import type { RegisterFormData } from '../../shared/types/form.types';
import { NameStep } from './NameStep.component';
import { EmailStep } from './EmailStep.component';
import { PasswordStep } from './PasswordStep.component';

type RegisterFormProps = {
  control: Control<RegisterFormData>;
  errors: FieldErrors<RegisterFormData>;
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
          control={control}
          errors={errors}
          onNext={onNext}
          isLoading={isLoading}
          buttonText={buttonText}
        />
      );
    case 'email':
      return (
        <EmailStep
          control={control}
          errors={errors}
          onNext={onNext}
          isLoading={isLoading}
          buttonText={buttonText}
        />
      );
    case 'password':
      return (
        <PasswordStep
          control={control}
          errors={errors}
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

