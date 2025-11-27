import React, { useState } from 'react';
import { Switch } from 'react-native';
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
            onValueChange={setPushNotifications}
          />

          <NotificationItem
            label="Powiadomienia email"
            description="Otrzymuj powiadomienia na email"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />

          <NotificationItem
            label="Dźwięk"
            description="Odtwarzaj dźwięk przy powiadomieniach"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
        </View>
      </View>
    </View>
  );
};

