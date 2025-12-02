import type { IntegrationPermission } from '../BaseIntegrationCard.component';

export function getDefaultPermissions(integrationName: string): IntegrationPermission[] {
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
}

