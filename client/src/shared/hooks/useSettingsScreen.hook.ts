import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useLogout } from './useAuth.hook';
import { useUpdateProfile, useChangePassword } from './useProfile.hook';
import { useAuthStore } from '../../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type UseSettingsScreenProps = {
  navigation?: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export const useSettingsScreen = ({}: UseSettingsScreenProps = {}) => {
  const { clearAuth, user } = useAuthStore();
  const logoutMutation = useLogout();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const handleEditProfile = useCallback(() => {
    if (!user) return;

    Alert.prompt(
      'Edytuj profil',
      'Wprowadź nowe dane',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Zapisz',
          onPress: async (name?: string) => {
            if (!name || name.trim().length < 2) {
              Alert.alert('Błąd', 'Imię musi mieć minimum 2 znaki');
              return;
            }

            try {
              await updateProfileMutation.mutateAsync({ name: name.trim() });
              Alert.alert('Sukces', 'Profil został zaktualizowany');
            } catch (error: any) {
              Alert.alert('Błąd', error.message || 'Nie udało się zaktualizować profilu');
            }
          },
        },
      ],
      'plain-text',
      user.name,
    );
  }, [user, updateProfileMutation]);

  const handleChangePassword = useCallback(() => {
    Alert.prompt(
      'Zmień hasło',
      'Wprowadź aktualne hasło',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Dalej',
          onPress: async (currentPassword?: string) => {
            if (!currentPassword || currentPassword.length < 6) {
              Alert.alert('Błąd', 'Hasło musi mieć minimum 6 znaków');
              return;
            }

            Alert.prompt(
              'Zmień hasło',
              'Wprowadź nowe hasło',
              [
                {
                  text: 'Anuluj',
                  style: 'cancel',
                },
                {
                  text: 'Zmień',
                  onPress: async (newPassword?: string) => {
                    if (!newPassword || newPassword.length < 6) {
                      Alert.alert('Błąd', 'Nowe hasło musi mieć minimum 6 znaków');
                      return;
                    }

                    if (newPassword === currentPassword) {
                      Alert.alert('Błąd', 'Nowe hasło musi różnić się od aktualnego');
                      return;
                    }

                    try {
                      await changePasswordMutation.mutateAsync({
                        currentPassword,
                        newPassword,
                      });
                      Alert.alert('Sukces', 'Hasło zostało zmienione pomyślnie');
                    } catch (error: any) {
                      Alert.alert('Błąd', error.message || 'Nie udało się zmienić hasła');
                    }
                  },
                },
              ],
              'secure-text',
            );
          },
        },
      ],
      'secure-text',
    );
  }, [changePasswordMutation]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Usuń konto',
      'Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna.',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implementacja usuwania konta
            Alert.alert('Info', 'Funkcja usuwania konta będzie dostępna wkrótce');
          },
        },
      ],
    );
  }, []);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Wyloguj się',
      'Czy na pewno chcesz się wylogować?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutMutation.mutateAsync();
              clearAuth();
            } catch (error) {
              console.error('Logout error:', error);
              clearAuth();
            }
          },
        },
      ],
    );
  }, [logoutMutation, clearAuth]);

  return {
    handleEditProfile,
    handleChangePassword,
    handleDeleteAccount,
    handleLogout,
    isLoading: logoutMutation.isPending,
    updateProfileMutation,
    changePasswordMutation,
  };
};

