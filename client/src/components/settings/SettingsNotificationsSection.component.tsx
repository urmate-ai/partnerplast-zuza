import React, { useRef } from 'react';
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

  console.log('🎨 [COMPONENT] Render - Profile data:', JSON.stringify({
    pushNotifications,
    emailNotifications,
    soundEnabled,
    isUpdating: isUpdatingRef.current,
    isPending: updateNotificationsMutation.isPending,
  }));

  const handlePushNotificationsChange = (value: boolean) => {
    console.log('👆 [PUSH] Switch clicked, new value:', value);
    console.log('👆 [PUSH] Current isUpdating:', isUpdatingRef.current);
    console.log('👆 [PUSH] Current profile value:', pushNotifications);
    
    if (isUpdatingRef.current) {
      console.log('🚫 [PUSH] Blocked - already updating');
      return;
    }
    
    console.log('✅ [PUSH] Proceeding with mutation');
    isUpdatingRef.current = true;
    updateNotificationsMutation.mutate(
      { pushNotifications: value },
      {
        onSuccess: () => {
          console.log('✅ [PUSH] Component onSuccess callback');
          showToast({
            type: 'success',
            text1: value ? 'Powiadomienia push włączone' : 'Powiadomienia push wyłączone',
            visibilityTime: 2000,
          });
        },
        onError: (error: any) => {
          console.log('❌ [PUSH] Component onError callback:', error);
          showToast({
            type: 'error',
            text1: 'Błąd',
            text2: error.message || 'Nie udało się zaktualizować ustawień',
            visibilityTime: 3000,
          });
        },
        onSettled: () => {
          console.log('🏁 [PUSH] Component onSettled - releasing lock');
          isUpdatingRef.current = false;
        },
      },
    );
  };

  const handleEmailNotificationsChange = (value: boolean) => {
    console.log('👆 [EMAIL] Switch clicked, new value:', value);
    console.log('👆 [EMAIL] Current isUpdating:', isUpdatingRef.current);
    console.log('👆 [EMAIL] Current profile value:', emailNotifications);
    
    if (isUpdatingRef.current) {
      console.log('🚫 [EMAIL] Blocked - already updating');
      return;
    }
    
    console.log('✅ [EMAIL] Proceeding with mutation');
    isUpdatingRef.current = true;
    updateNotificationsMutation.mutate(
      { emailNotifications: value },
      {
        onSuccess: () => {
          console.log('✅ [EMAIL] Component onSuccess callback');
          showToast({
            type: 'success',
            text1: value ? 'Powiadomienia email włączone' : 'Powiadomienia email wyłączone',
            visibilityTime: 2000,
          });
        },
        onError: (error: any) => {
          console.log('❌ [EMAIL] Component onError callback:', error);
          showToast({
            type: 'error',
            text1: 'Błąd',
            text2: error.message || 'Nie udało się zaktualizować ustawień',
            visibilityTime: 3000,
          });
        },
        onSettled: () => {
          console.log('🏁 [EMAIL] Component onSettled - releasing lock');
          isUpdatingRef.current = false;
        },
      },
    );
  };

  const handleSoundChange = (value: boolean) => {
    console.log('👆 [SOUND] Switch clicked, new value:', value);
    console.log('👆 [SOUND] Current isUpdating:', isUpdatingRef.current);
    console.log('👆 [SOUND] Current profile value:', soundEnabled);
    
    if (isUpdatingRef.current) {
      console.log('🚫 [SOUND] Blocked - already updating');
      return;
    }
    
    console.log('✅ [SOUND] Proceeding with mutation');
    isUpdatingRef.current = true;
    updateNotificationsMutation.mutate(
      { soundEnabled: value },
      {
        onSuccess: () => {
          console.log('✅ [SOUND] Component onSuccess callback');
          showToast({
            type: 'success',
            text1: value ? 'Dźwięk włączony' : 'Dźwięk wyłączony',
            visibilityTime: 2000,
          });
        },
        onError: (error: any) => {
          console.log('❌ [SOUND] Component onError callback:', error);
          showToast({
            type: 'error',
            text1: 'Błąd',
            text2: error.message || 'Nie udało się zaktualizować ustawień',
            visibilityTime: 3000,
          });
        },
        onSettled: () => {
          console.log('🏁 [SOUND] Component onSettled - releasing lock');
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
