import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from './useAuth.hook';
import { useAuthStore } from '../../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

type UseLoginScreenProps = {
  navigation: NavigationProp;
};

export const useLoginScreen = ({ navigation }: UseLoginScreenProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);
  const loginMutation = useLogin();

  const {
    control,
    formState: { errors },
    trigger,
    getValues,
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onEmailSubmit = async () => {
    const isValid = await trigger('email');
    if (isValid) {
      setEmailSubmitted(true);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      navigation.replace('Home');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Nieznany błąd';
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401')) {
        setError('password', { type: 'manual', message: 'Nieprawidłowy email lub hasło' });
      } else if (errorMessage.includes('Network Error')) {
        setError('email', { type: 'manual', message: 'Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.' });
      } else {
        setError('email', { type: 'manual', message: 'Błąd logowania: ' + errorMessage });
      }
    }
  };

  const handlePasswordSubmit = async (data: LoginFormData) => {
    const isPasswordValid = await trigger('password');
    if (isPasswordValid) {
      await onSubmit(data);
    }
  };

  const onEmailChange = () => {
    if (errors.email) {
      setError('email', { message: undefined });
    }
    if (errors.password) {
      setError('password', { message: undefined });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { loginWithGoogle } = await import('../../services/oauth.service');
      const response = await loginWithGoogle();
      await useAuthStore.getState().setAuth(response.user, response.accessToken);
      navigation.replace('Home');
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      if (errorMessage.includes('cancelled')) {
        // User cancelled, don't show error
        return;
      }
      setError('email', { type: 'manual', message: 'Błąd logowania Google: ' + errorMessage });
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { loginWithApple } = await import('../../services/oauth.service');
      const response = await loginWithApple();
      await useAuthStore.getState().setAuth(response.user, response.accessToken);
      navigation.replace('Home');
    } catch (error) {
      console.error('Apple login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      setError('email', { type: 'manual', message: 'Błąd logowania Apple: ' + errorMessage });
    }
  };

  return {
    control,
    errors,
    showPassword,
    onTogglePassword: () => setShowPassword((prev) => !prev),
    emailSubmitted,
    setEmailSubmitted,
    onEmailSubmit,
    handlePasswordSubmit,
    isLoading: loginMutation.isPending,
    loginError: errors.email?.message || errors.password?.message || null,
    getValues,
    onEmailChange,
    handleGoogleLogin,
    handleAppleLogin,
  };
};

