import React from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { Button } from '../../shared/components/Button.component';

interface DeleteChatModalProps {
  visible: boolean;
  chatTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeleteChatModal: React.FC<DeleteChatModalProps> = ({
  visible,
  chatTitle,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={styles.modalContainer}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text className="text-xl font-semibold text-gray-900 mb-2">
                Usuń czat
              </Text>
              <Text className="text-base text-gray-600 mb-6">
                Czy na pewno chcesz usunąć czat "{chatTitle}"? Ta operacja jest nieodwracalna.
              </Text>
              
              <View className="flex-row gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onPress={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Anuluj
                </Button>
                <TouchableOpacity
                  onPress={onConfirm}
                  disabled={isLoading}
                  activeOpacity={0.85}
                  style={[
                    styles.deleteButton,
                    isLoading && styles.deleteButtonDisabled,
                  ]}
                >
                  <Text className="text-white text-lg font-semibold">
                    {isLoading ? 'Usuwanie...' : 'Usuń'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 300,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});

