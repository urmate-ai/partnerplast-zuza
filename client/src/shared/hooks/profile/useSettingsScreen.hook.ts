import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLogout, useDeleteAccount } from '../auth/useAuth.hook';
import { getApiErrorMessage } from '../../types/api.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/RootNavigator';

type UseSettingsScreenProps = {
  navigation?: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export const useSettingsScreen = ({}: UseSettingsScreenProps = {}) => {
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  const handleChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
  }, [navigation]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Usuń konto',
      'Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna i spowoduje usunięcie wszystkich Twoich danych, w tym czatów i wiadomości.',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccountMutation.mutateAsync();
              Alert.alert(
                'Konto usunięte',
                'Twoje konto zostało pomyślnie usunięte.',
                [{ text: 'OK' }],
              );
            } catch (error) {
              console.error('Delete account error:', error);
              const errorMessage = getApiErrorMessage(error, 'Wystąpił błąd podczas usuwania konta. Spróbuj ponownie.');
              Alert.alert('Błąd', errorMessage);
            }
          },
        },
      ],
    );
  }, [deleteAccountMutation]);

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
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ],
    );
  }, [logoutMutation]);

  return {
    handleEditProfile,
    handleChangePassword,
    handleDeleteAccount,
    handleLogout,
    isLoading: logoutMutation.isPending || deleteAccountMutation.isPending,
  };
};

