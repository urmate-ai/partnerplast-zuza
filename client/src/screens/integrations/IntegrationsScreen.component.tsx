import React, { useState, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../../shared/components/View.component';
import { ScreenHeader } from '../../shared/components/ScreenHeader.component';
import { SearchBar } from '../../shared/components/SearchBar.component';
import { LoadingState } from '../../shared/components/LoadingState.component';
import { ErrorState } from '../../shared/components/ErrorState.component';
import { EmptyState } from '../../shared/components/EmptyState.component';
import { IntegrationCard } from '../../components/integrations/IntegrationCard.component';
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
      <ScreenHeader title="Integracje" onBack={() => navigation.goBack()} />
      <View className="px-6">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Szukaj integracji..."
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {isLoading ? (
          <LoadingState message="Ładowanie integracji..." />
        ) : error ? (
          <ErrorState message={getErrorMessage(error)} />
        ) : filteredIntegrations.length === 0 ? (
          <EmptyState
            icon="link-outline"
            title={
              searchQuery
                ? 'Nie znaleziono integracji pasujących do wyszukiwania'
                : 'Brak dostępnych integracji'
            }
          />
        ) : (
          <View className="px-6 pt-6">
            {filteredIntegrations.map((integration: Integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
