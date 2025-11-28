import React, { useRef } from 'react';
import { Switch } from 'react-native';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { useProfile, useUpdateNotifications } from '../../shared/hooks/useProfile.hook';
import { showToast } from '../../shared/components/Toast.component';

type NotificationItemProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

type NotificationItemPropsWithDisabled = NotificationItemProps & {
  disabled?: boolean;
};

const NotificationItem: React.FC<NotificationItemPropsWithDisabled> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
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
        disabled={disabled}
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
  
  const isUpdatingRef = useRef(false);

  const pushNotifications = profile?.pushNotifications ?? true;
  const emailNotifications = profile?.emailNotifications ?? false;
  const soundEnabled = profile?.soundEnabled ?? true;

  const handlePushNotificationsChange = (value: boolean) => {
    if (isUpdatingRef.current) {
      return;
    }
    
    isUpdatingRef.current = true;
    updateNotificationsMutation.mutate(
      { pushNotifications: value },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            text1: value ? 'Powiadomienia push włączone' : 'Powiadomienia push wyłączone',
            visibilityTime: 2000,
          });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || error?.message || 'Nie udało się zaktualizować ustawień';
          showToast({
            type: 'error',
            text1: 'Błąd',
            text2: errorMessage,
            visibilityTime: 3000,
          });
        },
        onSettled: () => {
          isUpdatingRef.current = false;
        },
      },
    );
  };

  const handleEmailNotificationsChange = (value: boolean) => {
    
    if (isUpdatingRef.current) {
      return;
    }
    
    isUpdatingRef.current = true;
    updateNotificationsMutation.mutate(
      { emailNotifications: value },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            text1: value ? 'Powiadomienia email włączone' : 'Powiadomienia email wyłączone',
            visibilityTime: 2000,
          });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || error?.message || 'Nie udało się zaktualizować ustawień';
          showToast({
            type: 'error',
            text1: 'Błąd',
            text2: errorMessage,
            visibilityTime: 3000,
          });
        },
        onSettled: () => {
          isUpdatingRef.current = false;
        },
      },
    );
  };

  const handleSoundChange = (value: boolean) => {
    if (isUpdatingRef.current) {
      return;
    }
    
    isUpdatingRef.current = true;
    updateNotificationsMutation.mutate(
      { soundEnabled: value },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            text1: value ? 'Dźwięk włączony' : 'Dźwięk wyłączony',
            visibilityTime: 2000,
          });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || error?.message || 'Nie udało się zaktualizować ustawień';
          showToast({
            type: 'error',
            text1: 'Błąd',
            text2: errorMessage,
            visibilityTime: 3000,
          });
        },
        onSettled: () => {
          isUpdatingRef.current = false;
        },
      },
    );
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
