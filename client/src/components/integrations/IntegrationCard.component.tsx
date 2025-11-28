import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { getSafeIconName } from '../../shared/utils/icon.utils';
import type { Integration } from '../../services/integrations.service';

type IntegrationCardProps = {
  integration: Integration;
  onPress?: () => void;
};

const getCategoryColor = (category?: string): string => {
  switch (category?.toLowerCase()) {
    case 'communication':
      return 'bg-blue-50 border-blue-200';
    case 'productivity':
      return 'bg-green-50 border-green-200';
    case 'social':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onPress,
}) => {
  const iconName = getSafeIconName(integration.icon);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={`mb-4 rounded-xl border p-4 ${getCategoryColor(integration.category)}`}
      onPress={onPress}
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-lg bg-white items-center justify-center mr-4 border border-gray-200">
          <Ionicons name={iconName} size={24} color="#111827" />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-semibold text-gray-900 mr-2">
              {integration.name}
            </Text>
            {integration.isActive && (
              <View className="bg-green-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-medium text-green-800">Aktywna</Text>
              </View>
            )}
          </View>

          {integration.description && (
            <Text className="text-sm text-gray-600 mb-2">{integration.description}</Text>
          )}

          {integration.category && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1 capitalize">
                {integration.category}
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
};

