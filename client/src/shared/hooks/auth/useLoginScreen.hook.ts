import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from './useAuth.hook';
import { useAuthStore } from '../../../stores/authStore';
import { useGoogleAuth } from '../../../services/oauth.service';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { getApiErrorMessage } from '../../types/api.types';
import type { User } from '../../types';

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
  const [googleError, setGoogleError] = useState<string | null>(null);
  const loginMutation = useLogin();
  const { handleGoogleLogin: googleLogin } = useGoogleAuth();

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
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const onEmailSubmit = async () => {
    try {
      const isValid = await trigger('email');
      if (isValid) {
        setEmailSubmitted(true);
      }
    } catch (error) {
      console.error('onEmailSubmit error:', error);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      navigation.replace('Home');
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = getApiErrorMessage(error, 'Nieznany błąd');
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401') || errorMessage.includes('Nieprawidłowy email lub hasło')) {
        setError('password', { type: 'manual', message: 'Nieprawidłowy email lub hasło' });
      } else if (errorMessage.includes('Network Error')) {
        setError('email', { type: 'manual', message: 'Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.' });
      } else {
        setError('email', { type: 'manual', message: 'Błąd logowania: ' + errorMessage });
      }
    }
  };

  const handlePasswordSubmit = async (data: LoginFormData) => {
    try {
      const isPasswordValid = await trigger('password');
      if (!isPasswordValid) {
        console.log('Password validation failed:', errors.password);
        return;
      }
      await onSubmit(data);
    } catch (error) {
      console.error('handlePasswordSubmit error:', error);
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
      setGoogleError(null);
      
      const result = await googleLogin();
      
      if (result.type === 'success' && result.token && result.user) {
        await useAuthStore.getState().setAuth(result.user as unknown as User, result.token);
        navigation.replace('Home');
      } else if (result.type === 'error' || result.error) {
        setGoogleError('Błąd logowania Google: ' + (result.error || 'Nieznany błąd'));
      } else if (result.type === 'cancel') {
        console.log('Google login cancelled');
      }
    } catch (error: unknown) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      setGoogleError('Błąd logowania Google: ' + errorMessage);
    }
  };

  const getServerError = (): string | null => {
    const emailError = errors.email;
    const passwordError = errors.password;
    
    if (emailError?.type === 'manual' && emailError.message) {
      return emailError.message;
    }
    if (passwordError?.type === 'manual' && passwordError.message) {
      return passwordError.message;
    }
    
    return null;
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
    loginError: getServerError(),
    getValues,
    onEmailChange,
    handleGoogleLogin,
    googleError,
  };
};

