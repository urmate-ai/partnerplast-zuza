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
import type { RootStackParamList } from '../navigation/RootNavigator';

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

type RegisterStep = 'name' | 'email' | 'password';
type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [currentStep, setCurrentStep] = useState<RegisterStep>('name');
  const [formData, setFormData] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

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
    handleSubmit,
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
    setIsLoading(true);
    try {
      const { register } = await import('../services/auth.service');
      const { useAuthStore } = await import('../stores/authStore');
      
      const response = await register(data);
      await useAuthStore.getState().setAuth(response.user, response.accessToken);
      
      navigation.replace('Home');
    } catch (error) {
      console.error('Register error:', error);
      alert('Błąd rejestracji: ' + (error instanceof Error ? error.message : 'Nieznany błąd'));
    } finally {
      setIsLoading(false);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Wróć</Text>
        </Pressable>
        <Text style={styles.stepIndicator}>
          Krok {currentStep === 'name' ? 1 : currentStep === 'email' ? 2 : 3} z 3
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{getStepTitle()}</Text>

        <View style={styles.formSection}>
          <Controller
            control={control}
            name={currentStep}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    errors[currentStep] && styles.inputError,
                  ]}
                  placeholder={getStepPlaceholder()}
                  placeholderTextColor="#9CA3AF"
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
                />
                {errors[currentStep] && (
                  <Text style={styles.errorText}>
                    {errors[currentStep]?.message as string}
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
            onPress={onNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>{getButtonText()}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Masz już konto? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Zaloguj się</Text>
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
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
});

