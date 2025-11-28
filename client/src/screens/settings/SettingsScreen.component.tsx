import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../../shared/components/View.component';
import { ScreenHeader } from '../../shared/components/ScreenHeader.component';
import { LoadingState } from '../../shared/components/LoadingState.component';
import { useAuthStore } from '../../stores/authStore';
import { useProfile } from '../../shared/hooks/profile/useProfile.hook';
import { useSettingsScreen } from '../../shared/hooks/profile/useSettingsScreen.hook';
import { SettingsProfileSection } from '../../components/settings/SettingsProfileSection.component';
import { SettingsSecuritySection } from '../../components/settings/SettingsSecuritySection.component';
import { SettingsNotificationsSection } from '../../components/settings/SettingsNotificationsSection.component';
import { SettingsAppSection } from '../../components/settings/SettingsAppSection.component';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user: authUser } = useAuthStore();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const {
    handleEditProfile,
    handleChangePassword,
    handleDeleteAccount,
    handleLogout,
    isLoading,
  } = useSettingsScreen({ navigation });

  const user = profile || authUser;

  if (isLoadingProfile) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Ustawienia" onBack={() => navigation.goBack()} />
        <LoadingState />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Ustawienia" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pt-6">
          <SettingsProfileSection
            user={user}
            onEditProfile={handleEditProfile}
            isLoading={isLoading}
          />

          <SettingsSecuritySection
            onChangePassword={handleChangePassword}
            onDeleteAccount={handleDeleteAccount}
            isLoading={isLoading}
          />

          <SettingsNotificationsSection />

          <SettingsAppSection onLogout={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
};

