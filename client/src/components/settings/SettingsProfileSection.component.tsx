import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type User = {
  id: string;
  email: string;
  name: string;
};

type SettingsProfileSectionProps = {
  user: User | null;
  onEditProfile: () => void;
};

export const SettingsProfileSection: React.FC<SettingsProfileSectionProps> = ({
  user,
  onEditProfile,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View className="mb-8">
      <Text variant="h3" className="mb-4 text-gray-900 font-semibold">
        Profil
      </Text>

      <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <TouchableOpacity
          onPress={onEditProfile}
          activeOpacity={0.7}
          className="flex-row items-center px-4 py-4"
        >

          <View className="flex-1">
            <Text className="text-base text-gray-900 font-semibold mb-1">
              {user?.name || 'Użytkownik'}
            </Text>
            <Text className="text-sm text-gray-500">{user?.email || ''}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

