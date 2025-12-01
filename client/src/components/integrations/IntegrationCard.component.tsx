import React, { useState } from 'react';
import { Alert } from 'react-native';
import { getSafeIconName } from '../../shared/utils/icon.utils';
import type { Integration } from '../../services/integrations.service';
import {
  BaseIntegrationCard,
  type IntegrationPermission,
} from './BaseIntegrationCard.component';

type IntegrationCardProps = {
  integration: Integration;
};

const getCategoryColor = (category?: string): { iconColor: string; backgroundColor: string } => {
  switch (category?.toLowerCase()) {
    case 'communication':
      return { iconColor: '#2563EB', backgroundColor: '#DBEAFE' };
    case 'productivity':
      return { iconColor: '#16A34A', backgroundColor: '#DCFCE7' };
    case 'social':
      return { iconColor: '#9333EA', backgroundColor: '#F3E8FF' };
    default:
      return { iconColor: '#6B7280', backgroundColor: '#F3F4F6' };
  }
};

const getDefaultPermissions = (category?: string): IntegrationPermission[] => {
  switch (category?.toLowerCase()) {
    case 'communication':
      return [
        { label: 'Odczyt wiadomości', icon: 'mail-outline' },
        { label: 'Wysyłanie wiadomości', icon: 'send-outline' },
      ];
    case 'productivity':
      return [
        { label: 'Odczyt danych', icon: 'eye-outline' },
        { label: 'Edycja danych', icon: 'create-outline' },
      ];
    case 'social':
      return [
        { label: 'Dostęp do profilu', icon: 'person-outline' },
        { label: 'Publikowanie treści', icon: 'share-outline' },
      ];
    default:
      return [
        { label: 'Podstawowy dostęp', icon: 'checkmark-circle' },
      ];
  }
};

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
}) => {
  const [isConnected] = useState(false);
  const [isLoading] = useState(false);
  
  const iconName = getSafeIconName(integration.icon);
  const colors = getCategoryColor(integration.category);
  const permissions = getDefaultPermissions(integration.category);

  const handleConnect = () => {
    Alert.alert(
      'Wkrótce dostępne',
      `Integracja z ${integration.name} będzie wkrótce dostępna!`,
      [{ text: 'OK' }]
    );
  };

  const handleDisconnect = () => {
    Alert.alert('Rozłącz', `Rozłącz ${integration.name}?`);
  };

  return (
    <BaseIntegrationCard
      name={integration.name}
      description={integration.description || 'Integracja'}
      icon={iconName}
      iconColor={colors.iconColor}
      iconBackgroundColor={colors.backgroundColor}
      isConnected={isConnected}
      isLoading={isLoading}
      permissions={permissions}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      connectButtonText={`Połącz z ${integration.name}`}
      disconnectButtonText={`Rozłącz ${integration.name}`}
      connectedDescription={`Twoje konto ${integration.name} jest połączone.`}
      disconnectedDescription={`Połącz swoje konto ${integration.name}, aby korzystać z dodatkowych funkcji.`}
    />
  );
};

