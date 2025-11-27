import React, { useState } from 'react';
import { Switch } from 'react-native';
import Toast from 'react-native-toast-message';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

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
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handlePushNotificationsChange = (value: boolean) => {
    setPushNotifications(value);
    Toast.show({
      type: 'success',
      text1: value ? 'Powiadomienia push włączone' : 'Powiadomienia push wyłączone',
      text2: value
        ? 'Będziesz otrzymywać powiadomienia na urządzeniu'
        : 'Nie będziesz otrzymywać powiadomień push',
      visibilityTime: 3000,
    });
  };

  const handleEmailNotificationsChange = (value: boolean) => {
    setEmailNotifications(value);
    Toast.show({
      type: 'success',
      text1: value ? 'Powiadomienia email włączone' : 'Powiadomienia email wyłączone',
      text2: value
        ? 'Będziesz otrzymywać powiadomienia na email'
        : 'Nie będziesz otrzymywać powiadomień email',
      visibilityTime: 3000,
    });
  };

  const handleSoundChange = (value: boolean) => {
    setSoundEnabled(value);
    Toast.show({
      type: 'success',
      text1: value ? 'Dźwięk włączony' : 'Dźwięk wyłączony',
      text2: value
        ? 'Dźwięk będzie odtwarzany przy powiadomieniach'
        : 'Powiadomienia będą bez dźwięku',
      visibilityTime: 3000,
    });
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

