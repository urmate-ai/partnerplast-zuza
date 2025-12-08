import React from 'react';
import { Button } from '../../shared/components/Button.component';
import { Ionicons } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

export type IntegrationPermission = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export type BaseIntegrationCardProps = {
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  isConnected: boolean;
  connectedEmail?: string;
  isLoading: boolean;
  permissions: IntegrationPermission[];
  onConnect: () => void;
  onDisconnect: () => void;
  connectButtonText?: string;
  disconnectButtonText?: string;
  connectedDescription?: string;
  disconnectedDescription?: string;
}

export const BaseIntegrationCard: React.FC<BaseIntegrationCardProps> = ({
  name,
  description,
  icon,
  iconColor,
  iconBackgroundColor,
  isConnected,
  connectedEmail,
  isLoading,
  permissions,
  onConnect,
  onDisconnect,
  connectButtonText = 'Połącz',
  disconnectButtonText = 'Rozłącz',
  connectedDescription,
  disconnectedDescription,
}) => {
  return (
    <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center mb-4">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: iconBackgroundColor }}
        >
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{name}</Text>
          <Text className="text-sm text-gray-500">{description}</Text>
        </View>
        {isConnected && (
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-green-700">
              Połączono
            </Text>
          </View>
        )}
      </View>

      {isConnected && connectedEmail && (
        <View className="bg-gray-50 rounded-lg p-3 mb-4">
          <Text className="text-xs text-gray-500 mb-1">Połączone konto:</Text>
          <Text className="text-sm font-medium text-gray-900">
            {connectedEmail}
          </Text>
        </View>
      )}

      <Text className="text-sm text-gray-600 mb-4">
        {isConnected
          ? connectedDescription ||
            `Twoje konto ${name} jest połączone. Możesz teraz korzystać z integracji.`
          : disconnectedDescription ||
            `Połącz swoje konto ${name}, aby korzystać z dodatkowych funkcji.`}
      </Text>

      <Button
        onPress={isConnected ? onDisconnect : onConnect}
        disabled={isLoading}
        variant={isConnected ? 'secondary' : 'primary'}
        size="md"
        className="w-full"
      >
        {isLoading
          ? 'Ładowanie...'
          : isConnected
            ? disconnectButtonText
            : connectButtonText}
      </Button>

      {!isConnected && permissions.length > 0 && (
        <View className="mt-4 pt-4 border-t border-gray-100">
          <Text className="text-xs text-gray-500 mb-2 font-medium">
            Wymagane uprawnienia:
          </Text>
          <View className="space-y-1">
            {permissions.map((permission, index) => (
              <View key={index} className="flex-row items-center mb-1.5">
                <Ionicons
                  name={permission.icon || 'checkmark-circle'}
                  size={14}
                  color="#10B981"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-xs text-gray-600">
                  {permission.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

