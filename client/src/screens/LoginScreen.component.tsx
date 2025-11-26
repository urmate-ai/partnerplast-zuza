import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/RootNavigator';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    control,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmitEmail = async () => {
    const isValid = await trigger('email');
    if (isValid) {
      setEmailSubmitted(true);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const { login } = await import('../services/auth.service');
      const { useAuthStore } = await import('../stores/authStore');
      
      const response = await login(data);
      await useAuthStore.getState().setAuth(response.user, response.accessToken);
      
      navigation.replace('Home');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('401')) {
        setLoginError('Nieprawidłowy email lub hasło');
      } else if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        setLoginError('Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.');
      } else {
        setLoginError('Błąd logowania: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      const { loginWithGoogle } = await import('../services/oauth.service');
      const { useAuthStore } = await import('../stores/authStore');
      
      const response = await loginWithGoogle();
      await useAuthStore.getState().setAuth(response.user, response.accessToken);
      navigation.replace('Home');
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      if (errorMessage.includes('cancelled')) {
        setLoginError('Logowanie Google zostało anulowane');
      } else {
        setLoginError('Błąd logowania Google: ' + errorMessage);
      }
    }
  };

  const handleAppleLogin = async () => {
    setLoginError(null);
    try {
      const { loginWithApple } = await import('../services/oauth.service');
      const { useAuthStore } = await import('../stores/authStore');
      
      const response = await loginWithApple();
      await useAuthStore.getState().setAuth(response.user, response.accessToken);
      navigation.replace('Home');
    } catch (error) {
      console.error('Apple login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      setLoginError('Błąd logowania Apple: ' + errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Witaj ponownie</Text>

        {!emailSubmitted ? (
          <View style={styles.formSection}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.email && styles.inputError,
                    ]}
                    placeholder="Adres email"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (loginError) setLoginError(null);
                    }}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>
                      {errors.email.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.continueButtonPressed,
              ]}
              onPress={onSubmitEmail}
            >
              <Text style={styles.continueButtonText}>Kontynuuj</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.formSection}>
            <View style={styles.emailDisplayContainer}>
              <Text style={styles.emailDisplayLabel}>Email</Text>
              <View style={styles.emailDisplayBox}>
                <Text style={styles.emailDisplayText}>{getValues('email')}</Text>
                <Pressable
                  onPress={() => setEmailSubmitted(false)}
                  style={styles.changeEmailButton}
                >
                  <Text style={styles.changeEmailText}>Zmień</Text>
                </Pressable>
              </View>
            </View>

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.passwordLabel}>Hasło</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        errors.password && styles.inputError,
                      ]}
                      placeholder="Hasło"
                      placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (loginError) setLoginError(null);
                    }}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      autoCorrect={false}
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#6B7280"
                      />
                    </Pressable>
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                  {errors.email && (
                    <Text style={styles.errorText}>
                      {errors.email.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                (pressed || isLoading) && styles.continueButtonPressed,
                isLoading && styles.continueButtonDisabled,
              ]}
              onPress={async () => {
                console.log('=== ZALOGUJ SIĘ CLICKED ===');
                console.log('isLoading:', isLoading);
                const formValues = getValues();
                console.log('Current form values:', formValues);
                console.log('Form errors:', errors);
                
                setLoginError(null);
                
                // Waliduj tylko hasło, email już został zwalidowany
                const isPasswordValid = await trigger('password');
                const isEmailValid = formValues.email && formValues.email.length > 0;
                
                console.log('Password validation:', isPasswordValid);
                console.log('Email exists:', isEmailValid);
                
                if (isPasswordValid && isEmailValid) {
                  const data = getValues();
                  console.log('Calling onSubmit with:', data);
                  await onSubmit(data);
                } else {
                  console.log('Validation failed, not submitting');
                  console.log('Errors:', errors);
                  // Trigger re-render to show errors
                  await trigger('password');
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Zaloguj się</Text>
              )}
            </Pressable>

            {loginError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{loginError}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Nie masz konta? </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}>Zarejestruj się</Text>
          </Pressable>
        </View>

        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>LUB</Text>
          <View style={styles.separatorLine} />
        </View>

        <View style={styles.socialButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}
            onPress={handleGoogleLogin}
          >
            <AntDesign name="google" size={20} color="#DB4437" />
            <Text style={styles.socialButtonText}>Kontynuuj z Google</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              pressed && styles.socialButtonPressed,
            ]}
            onPress={handleAppleLogin}
          >
            <AntDesign name="apple" size={20} color="#000000" />
            <Text style={styles.socialButtonText}>Kontynuuj z Apple</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  formSection: {
    gap: 16,
  },
  inputWrapper: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  passwordLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueButtonPressed: {
    opacity: 0.9,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  socialButtonPressed: {
    backgroundColor: '#F9FAFB',
  },
  socialButtonText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginLeft: 12,
  },
  emailDisplayContainer: {
    marginBottom: 16,
  },
  emailDisplayLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  emailDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  emailDisplayText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  changeEmailButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeEmailText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorMessage: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
});
