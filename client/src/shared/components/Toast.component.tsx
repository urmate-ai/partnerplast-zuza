import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info';

export type ToastConfig = {
  type: ToastType;
  text1: string;
  text2?: string;
  visibilityTime?: number;
};

const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={[styles.toast, styles.successToast]}>
      <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.icon} />
      <View style={styles.content}>
        <Text style={[styles.text1, styles.successText1]}>{text1}</Text>
        {text2 && <Text style={[styles.text2, styles.successText2]}>{text2}</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={[styles.toast, styles.errorToast]}>
      <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.icon} />
      <View style={styles.content}>
        <Text style={[styles.text1, styles.errorText1]}>{text1}</Text>
        {text2 && <Text style={[styles.text2, styles.errorText2]}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={[styles.toast, styles.infoToast]}>
      <Ionicons name="information-circle" size={24} color="#3B82F6" style={styles.icon} />
      <View style={styles.content}>
        <Text style={[styles.text1, styles.infoText1]}>{text1}</Text>
        {text2 && <Text style={[styles.text2, styles.infoText2]}>{text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toast: {
    height: 'auto',
    minHeight: 60,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  successToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  errorToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  infoToast: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  text1: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  text2: {
    fontSize: 14,
    marginTop: 2,
  },
  successText1: {
    color: '#065F46',
  },
  successText2: {
    color: '#047857',
  },
  errorText1: {
    color: '#991B1B',
  },
  errorText2: {
    color: '#DC2626',
  },
  infoText1: {
    color: '#1E40AF',
  },
  infoText2: {
    color: '#2563EB',
  },
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      {children}
      <Toast config={toastConfig} />
    </>
  );
};

export const showToast = (config: ToastConfig) => {
  Toast.show({
    type: config.type,
    text1: config.text1,
    text2: config.text2,
    visibilityTime: config.visibilityTime || 3000,
    position: 'top',
    topOffset: 60,
    autoHide: true,
  });
};

export const useToast = () => {
  return {
    showToast,
  };
};
