import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../utils/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

type UseForgotPasswordScreenProps = {
  navigation: NavigationProp;
};

const forgotPasswordRequest = async (email: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  return response.data;
};

export const useForgotPasswordScreen = ({ navigation }: UseForgotPasswordScreenProps) => {
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordFormData) => forgotPasswordRequest(data.email),
    onSuccess: () => {
      setIsEmailSent(true);
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
    } catch (error: any) {
      console.error('Forgot password error:', error);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return {
    control,
    errors,
    handleSubmit: handleSubmit(onSubmit),
    isLoading: forgotPasswordMutation.isPending,
    isEmailSent,
    handleBackToLogin,
  };
};

