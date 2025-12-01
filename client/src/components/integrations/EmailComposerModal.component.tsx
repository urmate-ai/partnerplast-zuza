import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type EmailComposerData = {
  to?: string;
  subject?: string;
  body?: string;
  cc?: string[];
  bcc?: string[];
};

type EmailComposerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSend: (emailData: {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
  }) => Promise<void>;
  initialData?: EmailComposerData;
  isLoading?: boolean;
};

export function EmailComposerModal({
  visible,
  onClose,
  onSend,
  initialData,
  isLoading = false,
}: EmailComposerModalProps) {
  const [to, setTo] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [showCcBcc, setShowCcBcc] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setTo(initialData.to || '');
      setSubject(initialData.subject || '');
      setBody(initialData.body || '');
      setCc(initialData.cc?.join(', ') || '');
      setBcc(initialData.bcc?.join(', ') || '');
      if (initialData.cc?.length || initialData.bcc?.length) {
        setShowCcBcc(true);
      }
    }
  }, [initialData, visible]);

  const handleSend = async () => {
    if (!to.trim()) {
      Alert.alert('Błąd', 'Pole "Do" jest wymagane');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Błąd', 'Pole "Temat" jest wymagane');
      return;
    }

    if (!body.trim()) {
      Alert.alert('Błąd', 'Treść wiadomości jest wymagana');
      return;
    }

    const emailData = {
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
      cc: cc.trim() ? cc.split(',').map((e) => e.trim()) : undefined,
      bcc: bcc.trim() ? bcc.split(',').map((e) => e.trim()) : undefined,
    };

    try {
      await onSend(emailData);
      handleClose();
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const handleClose = () => {
    setTo('');
    setSubject('');
    setBody('');
    setCc('');
    setBcc('');
    setShowCcBcc(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Nowy email
            </Text>
            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">Wyślij</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            <View className="border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center px-4 py-3">
                <Text className="w-16 text-gray-600 dark:text-gray-400">
                  Do:
                </Text>
                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="email@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  className="flex-1 text-gray-900 dark:text-white"
                />
              </View>
            </View>

            {!showCcBcc && (
              <View className="px-4 py-2">
                <TouchableOpacity
                  onPress={() => setShowCcBcc(true)}
                  disabled={isLoading}
                >
                  <Text className="text-blue-600 dark:text-blue-400">
                    + Dodaj DW/UDW
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {showCcBcc && (
              <View className="border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center px-4 py-3">
                  <Text className="w-16 text-gray-600 dark:text-gray-400">
                    DW:
                  </Text>
                  <TextInput
                    value={cc}
                    onChangeText={setCc}
                    placeholder="email1@example.com, email2@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    className="flex-1 text-gray-900 dark:text-white"
                  />
                </View>
              </View>
            )}

            {showCcBcc && (
              <View className="border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center px-4 py-3">
                  <Text className="w-16 text-gray-600 dark:text-gray-400">
                    UDW:
                  </Text>
                  <TextInput
                    value={bcc}
                    onChangeText={setBcc}
                    placeholder="email1@example.com, email2@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    className="flex-1 text-gray-900 dark:text-white"
                  />
                </View>
              </View>
            )}

            <View className="border-b border-gray-200 dark:border-gray-700">
              <View className="flex-row items-center px-4 py-3">
                <Text className="w-16 text-gray-600 dark:text-gray-400">
                  Temat:
                </Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Temat wiadomości"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="sentences"
                  editable={!isLoading}
                  className="flex-1 text-gray-900 dark:text-white"
                />
              </View>
            </View>

            <View className="px-4 py-3">
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Treść wiadomości..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                autoCapitalize="sentences"
                editable={!isLoading}
                className="min-h-[200px] text-gray-900 dark:text-white"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

