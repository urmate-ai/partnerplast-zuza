import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../utils/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  confirmPassword: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;

type UseResetPasswordScreenProps = {
  token: string;
};

const resetPasswordRequest = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
};

export const useResetPasswordScreen = ({ token }: UseResetPasswordScreenProps) => {
  const navigation = useNavigation<NavigationProp>();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) => resetPasswordRequest(token, data.newPassword),
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigation.replace('Login');
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Reset password error:', error);
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPasswordMutation.mutateAsync(data);
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  const handleBackToLogin = () => {
    navigation.replace('Login');
  };

  return {
    control,
    errors,
    handleSubmit: handleSubmit(onSubmit),
    isLoading: resetPasswordMutation.isPending,
    isSuccess,
    handleBackToLogin,
  };
};

