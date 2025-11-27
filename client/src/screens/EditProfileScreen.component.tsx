import React from 'react';
import { ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { Input } from '../shared/components/Input.component';
import { Button } from '../shared/components/Button.component';
import { LoadingSpinner } from '../shared/components/LoadingSpinner.component';
import { useUpdateProfile } from '../shared/hooks/useProfile.hook';
import { useAuthStore } from '../stores/authStore';
import Toast from 'react-native-toast-message';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

const editProfileSchema = z.object({
  name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  email: z.string().email('Nieprawidłowy format email'),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user } = useAuthStore();
  const updateProfileMutation = useUpdateProfile();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const onSubmit = async (data: EditProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      Toast.show({
        type: 'success',
        text1: 'Sukces',
        text2: 'Profil został zaktualizowany',
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Błąd',
        text2: error.message || 'Nie udało się zaktualizować profilu',
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
            Edytuj profil
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
              Zaktualizuj swoje dane osobowe
            </Text>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Imię"
                  placeholder="Twoje imię"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect={false}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="Adres email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  error={errors.email?.message}
                />
              )}
            />
          </View>

          <Button
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="lg"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              'Zapisz zmiany'
            )}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

