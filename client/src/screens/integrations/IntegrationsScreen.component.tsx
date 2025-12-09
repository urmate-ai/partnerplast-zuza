import React, { useState, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { SafeAreaView } from '../../shared/components/SafeAreaView.component';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../shared/components/ScreenHeader.component';
import { SearchBar } from '../../shared/components/SearchBar.component';
import { LoadingState } from '../../shared/components/LoadingState.component';
import { ErrorState } from '../../shared/components/ErrorState.component';
import { EmptyState } from '../../shared/components/EmptyState.component';
import { IntegrationCard } from '../../components/integrations/components/IntegrationCard.component';
import { useIntegrations } from '../../shared/hooks/integrations/useIntegrations.hook';
import { getErrorMessage } from '../../shared/utils/error.utils';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { Integration } from '../../services/integrations.service';

type IntegrationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Integrations'
>;

export const IntegrationsScreen: React.FC = () => {
  const navigation = useNavigation<IntegrationsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { data: integrations, isLoading, error } = useIntegrations(
    searchQuery.trim() || undefined,
  );

  const filteredIntegrations = useMemo(() => {
    if (!integrations) return [];
    return integrations;
  }, [integrations]);

  const activeIntegrations = useMemo(
    () => filteredIntegrations.filter((integration) => integration.isActive),
    [filteredIntegrations],
  );

  const inactiveIntegrations = useMemo(
    () => filteredIntegrations.filter((integration) => !integration.isActive),
    [filteredIntegrations],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title="Integracje" onBack={() => navigation.goBack()} />
      <View className="px-6 mt-6">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Szukaj integracji..."
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: Math.max(insets.bottom, 32) 
        }}
      >
        {isLoading ? (
          <LoadingState message="Ładowanie integracji..." />
        ) : error ? (
          <ErrorState message={getErrorMessage(error)} />
        ) : filteredIntegrations.length === 0 && searchQuery ? (
          <View className="px-6 pt-6">
            <EmptyState
              icon="search-outline"
              title="Nie znaleziono integracji"
            />
          </View>
        ) : (
          <View className="px-6 pt-6">
            {activeIntegrations.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Aktywne integracje
                </Text>
                {activeIntegrations.map((integration: Integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                  />
                ))}
              </View>
            )}

            {inactiveIntegrations.length > 0 && (
              <View>
                <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Dostępne integracje
                </Text>
                {inactiveIntegrations.map((integration: Integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
