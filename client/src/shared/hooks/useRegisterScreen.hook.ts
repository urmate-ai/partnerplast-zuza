import { useState, useEffect, useMemo } from 'react';
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

  const currentSchema = useMemo(() => getCurrentSchema(), [currentStep]);

  const {
    control,
    formState: { errors },
    trigger,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      [currentStep]: formData[currentStep] || '',
    },
  });

  useEffect(() => {
    const currentValue = formData[currentStep] || '';
    reset({
      [currentStep]: currentValue,
    });
  }, [currentStep]);

  const onNext = async () => {
    try {
      const isValid = await trigger(currentStep);
      if (!isValid) {
        console.log('Validation failed:', errors);
        return;
      }

      const value = getValues()[currentStep];
      const newFormData = { ...formData, [currentStep]: value };
      setFormData(newFormData);

      if (currentStep === 'name') {
        setCurrentStep('email');
      } else if (currentStep === 'email') {
        setCurrentStep('password');
      } else if (currentStep === 'password') {
        await onSubmit(newFormData as RegisterFormData);
      }
    } catch (error) {
      console.error('onNext error:', error);
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

  const getErrorMessage = (): string | null => {
    if (!registerMutation.error) return null;
    
    const error = registerMutation.error;
    let errorMessage = 'Nieznany błąd';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
      errorMessage = errorObj?.response?.data?.message || errorObj?.message || 'Nieznany błąd';
    }
      
    if (errorMessage.includes('already exists') || errorMessage.includes('już istnieje')) {
      return 'Użytkownik z tym emailem już istnieje';
    }
    if (errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED')) {
      return 'Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.';
    }
    if (errorMessage.includes('table') && errorMessage.includes('does not exist')) {
      return 'Błąd bazy danych. Skontaktuj się z administratorem.';
    }
    
    return errorMessage;
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
        const name = formData.name || '';
        return name ? `Cześć ${name}, jaki jest Twój email?` : 'Jaki jest Twój email?';
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
    registerError: getErrorMessage(),
    getValues,
    onNext,
    onBack,
    getStepTitle,
    getStepPlaceholder,
    getButtonText,
  };
};

