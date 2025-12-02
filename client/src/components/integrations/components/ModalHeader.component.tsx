import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  isLoading?: boolean;
  actionDisabled?: boolean;
}

export function ModalHeader({
  title,
  onClose,
  onAction,
  actionLabel,
  isLoading = false,
  actionDisabled = false,
}: ModalHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onClose}
        disabled={isLoading || actionDisabled}
        style={styles.closeButton}
      >
        <Ionicons name="close" size={24} color="#6B7280" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      {onAction && actionLabel ? (
        <TouchableOpacity
          onPress={onAction}
          disabled={isLoading || actionDisabled}
          style={[styles.actionButton, (isLoading || actionDisabled) && styles.actionButtonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
});

