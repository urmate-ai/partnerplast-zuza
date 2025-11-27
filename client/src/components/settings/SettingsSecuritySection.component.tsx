import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type SettingsSecuritySectionProps = {
  onChangePassword: () => void;
  onDeleteAccount: () => void;
  isLoading?: boolean;
};

type SecurityItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
};

type SecurityItemPropsWithLoading = SecurityItemProps & {
  isLoading?: boolean;
};

const SecurityItem: React.FC<SecurityItemPropsWithLoading> = ({
  icon,
  label,
  description,
  onPress,
  variant = 'default',
  isLoading = false,
}) => {
  const textColor = variant === 'danger' ? 'text-red-600' : 'text-gray-900';
  const iconColor = variant === 'danger' ? '#DC2626' : '#6B7280';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLoading}
      className="flex-row items-center px-4 py-4 mb-2 last:mb-0"
      style={{ opacity: isLoading ? 0.6 : 1 }}
    >
      <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <View className="flex-1">
        <Text className={`text-base font-medium ${textColor}`}>{label}</Text>
        {description && (
          <Text className="text-sm text-gray-500 mt-0.5">{description}</Text>
        )}
      </View>

      {isLoading ? (
        <View className="w-5 h-5">
          <ActivityIndicator size="small" color="#9CA3AF" />  
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
};

export const SettingsSecuritySection: React.FC<SettingsSecuritySectionProps> = ({
  onChangePassword,
  onDeleteAccount,
  isLoading = false,
}) => {
  return (
    <View className="mb-8">
      <Text variant="h3" className="mb-4 text-gray-900 font-semibold">
        Bezpieczeństwo
      </Text>

      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <View className="px-2 py-2">
          <SecurityItem
            icon="lock-closed-outline"
            label="Zmień hasło"
            description="Zaktualizuj swoje hasło"
            onPress={onChangePassword}
            isLoading={isLoading}
          />

          <SecurityItem
            icon="trash-outline"
            label="Usuń konto"
            description="Trwale usuń swoje konto i wszystkie dane"
            onPress={onDeleteAccount}
            variant="danger"
          />
        </View>
      </View>
    </View>
  );
};

