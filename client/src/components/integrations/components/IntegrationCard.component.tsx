import React, { useMemo } from 'react';
import { Alert } from 'react-native';
import { getSafeIconName } from '../../../shared/utils/icon.utils';
import type { Integration } from '../../../services/integrations.service';
import { BaseIntegrationCard } from '../BaseIntegrationCard.component';
import { useGmailIntegration } from '../hooks/useGmailIntegration';
import { useCalendarIntegration } from '../hooks/useCalendarIntegration';
import { getCategoryColor } from '../utils/integration.utils';
import { getDefaultPermissions } from '../utils/integration-permissions.utils';

interface IntegrationCardProps {
  integration: Integration;
}

function useIntegrationHandlers(integrationName: string) {
  const gmailIntegration = useGmailIntegration(integrationName === 'Gmail');
  const calendarIntegration = useCalendarIntegration(
    integrationName === 'Google Calendar',
  );

  if (integrationName === 'Gmail') {
    return {
      isConnected: gmailIntegration.isConnected,
      connectedEmail: gmailIntegration.connectedEmail,
      isLoading: gmailIntegration.isLoading,
      onConnect: gmailIntegration.handleConnect,
      onDisconnect: gmailIntegration.handleDisconnect,
    };
  }

  if (integrationName === 'Google Calendar') {
    return {
      isConnected: calendarIntegration.isConnected,
      connectedEmail: calendarIntegration.connectedEmail,
      isLoading: calendarIntegration.isLoading,
      onConnect: calendarIntegration.handleConnect,
      onDisconnect: calendarIntegration.handleDisconnect,
    };
  }

  return {
    isConnected: false,
    connectedEmail: undefined,
    isLoading: false,
    onConnect: () => {
      Alert.alert(
        'Wkrótce dostępne',
        `Integracja z ${integrationName} będzie wkrótce dostępna!`,
        [{ text: 'OK' }],
      );
    },
    onDisconnect: () => {
      Alert.alert('Rozłącz', `Rozłącz ${integrationName}?`);
    },
  };
}

function getIntegrationTexts(integrationName: string) {
  const baseTexts = {
    connectButtonText: `Połącz z ${integrationName}`,
    disconnectButtonText: `Rozłącz ${integrationName}`,
    connectedDescription: `Twoje konto ${integrationName} jest połączone. Możesz teraz zarządzać przez asystenta.`,
    disconnectedDescription: `Połącz swoje konto ${integrationName}, aby asystent mógł zarządzać w Twoim imieniu.`,
  };

  switch (integrationName) {
    case 'Gmail':
      return {
        ...baseTexts,
        connectButtonText: 'Połącz z Gmail',
        disconnectButtonText: 'Rozłącz Gmail',
        connectedDescription:
          'Twoje konto Gmail jest połączone. Możesz teraz zarządzać emailami przez asystenta.',
        disconnectedDescription:
          'Połącz swoje konto Gmail, aby asystent mógł czytać i wysyłać emaile w Twoim imieniu.',
      };
    case 'Google Calendar':
      return {
        ...baseTexts,
        connectButtonText: 'Połącz z Google Calendar',
        disconnectButtonText: 'Rozłącz Google Calendar',
        connectedDescription:
          'Twoje konto Google Calendar jest połączone. Możesz teraz zarządzać wydarzeniami przez asystenta.',
        disconnectedDescription:
          'Połącz swoje konto Google Calendar, aby asystent mógł czytać i tworzyć wydarzenia w Twoim imieniu.',
      };
    default:
      return baseTexts;
  }
}

export function IntegrationCard({ integration }: IntegrationCardProps) {
  const handlers = useIntegrationHandlers(integration.name);
  const texts = useMemo(() => getIntegrationTexts(integration.name), [integration.name]);
  const iconName = useMemo(
    () => getSafeIconName(integration.icon),
    [integration.icon],
  );
  const colors = useMemo(
    () => getCategoryColor(integration.category),
    [integration.category],
  );
  const permissions = useMemo(
    () => getDefaultPermissions(integration.name),
    [integration.name],
  );

  return (
    <BaseIntegrationCard
      name={integration.name}
      description={integration.description || 'Integracja'}
      icon={iconName}
      iconColor={colors.iconColor}
      iconBackgroundColor={colors.backgroundColor}
      isConnected={handlers.isConnected}
      connectedEmail={handlers.connectedEmail}
      isLoading={handlers.isLoading}
      permissions={permissions}
      onConnect={handlers.onConnect}
      onDisconnect={handlers.onDisconnect}
      connectButtonText={texts.connectButtonText}
      disconnectButtonText={texts.disconnectButtonText}
      connectedDescription={texts.connectedDescription}
      disconnectedDescription={texts.disconnectedDescription}
    />
  );
}

