import React from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { useAuthStore } from '../stores/authStore';
import { useProfile } from '../shared/hooks/useProfile.hook';
import { useSettingsScreen } from '../shared/hooks/useSettingsScreen.hook';
import { SettingsProfileSection } from '../components/settings/SettingsProfileSection.component';
import { SettingsSecuritySection } from '../components/settings/SettingsSecuritySection.component';
import { SettingsNotificationsSection } from '../components/settings/SettingsNotificationsSection.component';
import { SettingsAppSection } from '../components/settings/SettingsAppSection.component';
import type { RootStackParamList } from '../navigation/RootNavigator';

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
    updateProfileMutation,
    changePasswordMutation,
  } = useSettingsScreen({ navigation });

  const user = profile || authUser;

  if (isLoadingProfile) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
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
            Ustawienia
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-6 pt-6">
          <SettingsProfileSection
            user={user}
            onEditProfile={handleEditProfile}
            isLoading={isLoading || updateProfileMutation.isPending}
          />

          <SettingsSecuritySection
            onChangePassword={handleChangePassword}
            onDeleteAccount={handleDeleteAccount}
            isLoading={isLoading || changePasswordMutation.isPending}
          />

          <SettingsNotificationsSection />

          <SettingsAppSection onLogout={handleLogout} />
        </View>
      </ScrollView>
    </View>
  );
};

