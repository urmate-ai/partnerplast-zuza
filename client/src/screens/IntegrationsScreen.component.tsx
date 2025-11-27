import React, { useState, useMemo } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { useIntegrations } from '../shared/hooks/useIntegrations.hook';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Integration } from '../services/integrations.service';

type IntegrationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Integrations'
>;

export const IntegrationsScreen: React.FC = () => {
  const navigation = useNavigation<IntegrationsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: integrations, isLoading, error } = useIntegrations(
    searchQuery.trim() || undefined,
  );

  const filteredIntegrations = useMemo(() => {
    if (!integrations) return [];
    return integrations;
  }, [integrations]);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
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
            Integracje
          </Text>
          <View className="w-10" />
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2">
          <Ionicons name="search-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Szukaj integracji..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-gray-900"
            style={{ fontSize: 16, color: '#111827' }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
              className="p-1"
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="text-gray-500 mt-4">Ładowanie integracji...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-red-500 text-center mt-4">
              {error instanceof Error ? error.message : 'Błąd podczas ładowania integracji'}
            </Text>
          </View>
        ) : filteredIntegrations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-6">
            <Ionicons name="link-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-4">
              {searchQuery
                ? 'Nie znaleziono integracji pasujących do wyszukiwania'
                : 'Brak dostępnych integracji'}
            </Text>
          </View>
        ) : (
          <View className="px-6 pt-6">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

type IntegrationCardProps = {
  integration: Integration;
};

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration }) => {
  const getCategoryColor = (category?: string) => {
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

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={`mb-4 rounded-xl border p-4 ${getCategoryColor(integration.category)}`}
    >
      <View className="flex-row items-start">
        {/* Icon */}
        <View className="w-12 h-12 rounded-lg bg-white items-center justify-center mr-4 border border-gray-200">
          {integration.icon ? (
            <Ionicons name={integration.icon as any} size={24} color="#111827" />
          ) : (
            <Ionicons name="link-outline" size={24} color="#6B7280" />
          )}
        </View>

        {/* Content */}
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

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
      </View>
    </TouchableOpacity>
  );
};

