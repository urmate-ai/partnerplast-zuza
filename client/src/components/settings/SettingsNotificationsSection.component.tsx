import React from 'react';
import { Switch } from 'react-native';
import { showToast } from '../../shared/components/Toast.component';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { useProfile, useUpdateNotifications } from '../../shared/hooks/useProfile.hook';

type NotificationItemProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  label,
  description,
  value,
  onValueChange,
}) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-4 mb-2 last:mb-0">
      <View className="flex-1 mr-4">
        <Text className="text-base text-gray-900 font-medium">{label}</Text>
        {description && (
          <Text className="text-sm text-gray-500 mt-0.5">{description}</Text>
        )}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#111827' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
};

export const SettingsNotificationsSection: React.FC = () => {
  const { data: profile } = useProfile();
  const updateNotificationsMutation = useUpdateNotifications();

  // Use profile data directly, with fallback defaults
  const pushNotifications = profile?.pushNotifications ?? true;
  const emailNotifications = profile?.emailNotifications ?? false;
  const soundEnabled = profile?.soundEnabled ?? true;

  const handlePushNotificationsChange = async (value: boolean) => {
    try {
      await updateNotificationsMutation.mutateAsync({ pushNotifications: value });
      showToast({
        type: 'success',
        text1: value ? 'Powiadomienia push włączone' : 'Powiadomienia push wyłączone',
        text2: value
          ? 'Będziesz otrzymywać powiadomienia na urządzeniu'
          : 'Nie będziesz otrzymywać powiadomień push',
        visibilityTime: 3000,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Błąd',
        text2: error.message || 'Nie udało się zaktualizować ustawień',
        visibilityTime: 3000,
      });
    }
  };

  const handleEmailNotificationsChange = async (value: boolean) => {
    try {
      await updateNotificationsMutation.mutateAsync({ emailNotifications: value });
      showToast({
        type: 'success',
        text1: value ? 'Powiadomienia email włączone' : 'Powiadomienia email wyłączone',
        text2: value
          ? 'Będziesz otrzymywać powiadomienia na email'
          : 'Nie będziesz otrzymywać powiadomień email',
        visibilityTime: 3000,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Błąd',
        text2: error.message || 'Nie udało się zaktualizować ustawień',
        visibilityTime: 3000,
      });
    }
  };

  const handleSoundChange = async (value: boolean) => {
    try {
      await updateNotificationsMutation.mutateAsync({ soundEnabled: value });
      showToast({
        type: 'success',
        text1: value ? 'Dźwięk włączony' : 'Dźwięk wyłączony',
        text2: value
          ? 'Dźwięk będzie odtwarzany przy powiadomieniach'
          : 'Powiadomienia będą bez dźwięku',
        visibilityTime: 3000,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        text1: 'Błąd',
        text2: error.message || 'Nie udało się zaktualizować ustawień',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <View className="mb-8">
      <Text variant="h3" className="mb-4 text-gray-900 font-semibold">
        Powiadomienia
      </Text>

      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <View className="px-2 py-2">
          <NotificationItem
            label="Powiadomienia push"
            description="Otrzymuj powiadomienia na urządzeniu"
            value={pushNotifications}
            onValueChange={handlePushNotificationsChange}
          />

          <NotificationItem
            label="Powiadomienia email"
            description="Otrzymuj powiadomienia na email"
            value={emailNotifications}
            onValueChange={handleEmailNotificationsChange}
          />

          <NotificationItem
            label="Dźwięk"
            description="Odtwarzaj dźwięk przy powiadomieniach"
            value={soundEnabled}
            onValueChange={handleSoundChange}
          />
        </View>
      </View>
    </View>
  );
};

