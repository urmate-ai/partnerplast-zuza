import React from 'react';
import { Alert } from 'react-native';
import { getSafeIconName } from '../../shared/utils/icon.utils';
import type { Integration } from '../../services/integrations.service';
import {
  BaseIntegrationCard,
  type IntegrationPermission,
} from './BaseIntegrationCard.component';
import { useGmailIntegration } from './hooks/useGmailIntegration';

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

const getDefaultPermissions = (integrationName: string): IntegrationPermission[] => {
  switch (integrationName) {
    case 'Gmail':
      return [
        { label: 'Odczyt wiadomości email', icon: 'mail-outline' },
        { label: 'Wysyłanie wiadomości', icon: 'send-outline' },
        { label: 'Zarządzanie etykietami', icon: 'pricetag-outline' },
      ];
    case 'Google Calendar':
      return [
        { label: 'Odczyt wydarzeń', icon: 'calendar-outline' },
        { label: 'Tworzenie wydarzeń', icon: 'add-circle-outline' },
        { label: 'Edycja wydarzeń', icon: 'create-outline' },
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
  const gmailIntegration = useGmailIntegration(integration.name === 'Gmail');
  
  const iconName = getSafeIconName(integration.icon);
  const colors = getCategoryColor(integration.category);
  const permissions = getDefaultPermissions(integration.name);

  // Obsługa Gmail
  if (integration.name === 'Gmail') {
    return (
      <BaseIntegrationCard
        name={integration.name}
        description={integration.description || 'Integracja'}
        icon={iconName}
        iconColor={colors.iconColor}
        iconBackgroundColor={colors.backgroundColor}
        isConnected={gmailIntegration.isConnected}
        connectedEmail={gmailIntegration.connectedEmail}
        isLoading={gmailIntegration.isLoading}
        permissions={permissions}
        onConnect={gmailIntegration.handleConnect}
        onDisconnect={gmailIntegration.handleDisconnect}
        connectButtonText="Połącz z Gmail"
        disconnectButtonText="Rozłącz Gmail"
        connectedDescription="Twoje konto Gmail jest połączone. Możesz teraz zarządzać emailami przez asystenta."
        disconnectedDescription="Połącz swoje konto Gmail, aby asystent mógł czytać i wysyłać emaile w Twoim imieniu."
      />
    );
  }

  // Obsługa innych integracji (placeholder)
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
      isConnected={false}
      isLoading={false}
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

