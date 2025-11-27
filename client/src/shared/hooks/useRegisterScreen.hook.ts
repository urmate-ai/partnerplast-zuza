import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from './useAuth.hook';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const registerStepSchemas = {
  name: z.object({
    name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  }),
  email: z.object({
    email: z
      .string()
      .min(1, 'Email jest wymagany')
      .email('Nieprawidłowy format email'),
  }),
  password: z.object({
    password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  }),
};

export type RegisterStep = 'name' | 'email' | 'password';

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

type UseRegisterScreenProps = {
  navigation: NavigationProp;
};

export const useRegisterScreen = ({ navigation }: UseRegisterScreenProps) => {
  const [currentStep, setCurrentStep] = useState<RegisterStep>('name');
  const [formData, setFormData] = useState<Partial<RegisterFormData>>({});
  const registerMutation = useRegister();

  const getCurrentSchema = () => {
    switch (currentStep) {
      case 'name':
        return registerStepSchemas.name;
      case 'email':
        return registerStepSchemas.email;
      case 'password':
        return registerStepSchemas.password;
    }
  };

  const {
    control,
    formState: { errors },
    trigger,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(getCurrentSchema()),
    defaultValues: {
      [currentStep]: formData[currentStep] || '',
    },
  });

  const onNext = async () => {
    const isValid = await trigger();
    if (!isValid) return;

    const value = getValues()[currentStep];
    const newFormData = { ...formData, [currentStep]: value };
    setFormData(newFormData);

    if (currentStep === 'name') {
      setCurrentStep('email');
      reset({ email: newFormData.email || '' });
    } else if (currentStep === 'email') {
      setCurrentStep('password');
      reset({ password: newFormData.password || '' });
    } else if (currentStep === 'password') {
      await onSubmit(newFormData as RegisterFormData);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data);
      navigation.replace('Home');
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const onBack = () => {
    if (currentStep === 'email') {
      setCurrentStep('name');
      reset({ name: formData.name || '' });
    } else if (currentStep === 'password') {
      setCurrentStep('email');
      reset({ email: formData.email || '' });
    } else {
      navigation.goBack();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'name':
        return 'Jak masz na imię?';
      case 'email':
        return 'Jaki jest Twój email?';
      case 'password':
        return 'Utwórz hasło';
    }
  };

  const getStepPlaceholder = () => {
    switch (currentStep) {
      case 'name':
        return 'Twoje imię';
      case 'email':
        return 'Adres email';
      case 'password':
        return 'Hasło (min. 6 znaków)';
    }
  };

  const getButtonText = () => {
    if (currentStep === 'password') return 'Utwórz konto';
    return 'Dalej';
  };

  return {
    control,
    errors,
    currentStep,
    formData,
    isLoading: registerMutation.isPending,
    registerError: registerMutation.error,
    getValues,
    onNext,
    onBack,
    getStepTitle,
    getStepPlaceholder,
    getButtonText,
  };
};

