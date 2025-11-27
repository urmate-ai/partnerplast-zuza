import React from 'react';
import { ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { PasswordInput } from '../shared/components/PasswordInput.component';
import { Button } from '../shared/components/Button.component';
import { LoadingSpinner } from '../shared/components/LoadingSpinner.component';
import { useChangePassword } from '../shared/hooks/useProfile.hook';
import Toast from 'react-native-toast-message';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ChangePassword'
>;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktualne hasło jest wymagane'),
  newPassword: z.string().min(6, 'Nowe hasło musi mieć minimum 6 znaków'),
  confirmPassword: z.string().min(6, 'Potwierdzenie hasła jest wymagane'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  const changePasswordMutation = useChangePassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Sukces',
        text2: 'Hasło zostało zmienione pomyślnie',
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Błąd',
        text2: error.message || 'Nie udało się zmienić hasła',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="pt-14 px-6 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 -ml-2"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text variant="h1" className="flex-1 text-center">
            Zmień hasło
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-6">
          <View className="mb-6">
            <Text variant="body" className="text-gray-600 mb-6">
              Wprowadź aktualne hasło i wybierz nowe
            </Text>

            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Aktualne hasło"
                  placeholder="Aktualne hasło"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  error={errors.currentPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Nowe hasło"
                  placeholder="Nowe hasło (min. 6 znaków)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  error={errors.newPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <PasswordInput
                  label="Potwierdź nowe hasło"
                  placeholder="Potwierdź nowe hasło"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  error={errors.confirmPassword?.message}
                />
              )}
            />
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="lg"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              'Zmień hasło'
            )}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

