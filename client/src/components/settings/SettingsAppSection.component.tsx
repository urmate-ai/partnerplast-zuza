import React from 'react';
import { TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type SettingsAppSectionProps = {
  onLogout: () => void;
};

type AppItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
};

const AppItem: React.FC<AppItemProps> = ({
  icon,
  label,
  description,
  onPress,
  variant = 'default',
}) => {
  const textColor = variant === 'danger' ? 'text-red-600' : 'text-gray-900';
  const iconColor = variant === 'danger' ? '#DC2626' : '#6B7280';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-4 py-4 mb-2 last:mb-0"
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

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

export const SettingsAppSection: React.FC<SettingsAppSectionProps> = ({
  onLogout,
}) => {
  const handlePrivacyPolicy = () => {
    // TODO: Dodać link do polityki prywatności
    Linking.openURL('https://example.com/privacy');
  };

  const handleTermsOfService = () => {
    // TODO: Dodać link do regulaminu
    Linking.openURL('https://example.com/terms');
  };

  const handleSupport = () => {
    // TODO: Dodać link do wsparcia
    Linking.openURL('mailto:support@example.com');
  };

  const handleAbout = () => {
    // TODO: Dodać ekran "O aplikacji"
    console.log('About');
  };

  return (
    <View className="mb-8">
      <Text variant="h3" className="mb-4 text-gray-900 font-semibold">
        Aplikacja
      </Text>

      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <View className="px-2 py-2">
          <AppItem
            icon="document-text-outline"
            label="Polityka prywatności"
            onPress={handlePrivacyPolicy}
          />

          <AppItem
            icon="document-outline"
            label="Regulamin"
            onPress={handleTermsOfService}
          />

          <AppItem
            icon="help-circle-outline"
            label="Wsparcie"
            description="Skontaktuj się z nami"
            onPress={handleSupport}
          />

          <AppItem
            icon="information-circle-outline"
            label="O aplikacji"
            description={`Wersja 1.0.0 (${Platform.OS})`}
            onPress={handleAbout}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={onLogout}
        activeOpacity={0.7}
        className="bg-white rounded-xl border border-red-200 overflow-hidden mt-6"
      >
        <View className="flex-row items-center justify-center px-4 py-4">
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="text-base text-red-600 font-semibold ml-2">
            Wyloguj się
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

