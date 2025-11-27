import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useLogout } from './useAuth.hook';
import { useAuthStore } from '../../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

type UseSettingsScreenProps = {
  navigation: NavigationProp;
};

export const useSettingsScreen = ({ navigation }: UseSettingsScreenProps) => {
  const { clearAuth } = useAuthStore();
  const logoutMutation = useLogout();

  const handleEditProfile = useCallback(() => {
    // TODO: Implementacja edycji profilu
    Alert.alert('Info', 'Funkcja edycji profilu będzie dostępna wkrótce');
  }, []);

  const handleChangePassword = useCallback(() => {
    // TODO: Implementacja zmiany hasła
    Alert.alert('Info', 'Funkcja zmiany hasła będzie dostępna wkrótce');
  }, []);

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
  };
};

