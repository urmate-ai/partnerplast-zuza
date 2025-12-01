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
  StyleSheet,
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

    console.log('[EmailComposerModal] Sending email data:', {
      to: emailData.to,
      subject: emailData.subject,
      bodyLength: emailData.body.length,
      bodyPreview: emailData.body.substring(0, 50),
    });

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
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nowy email</Text>
            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading}
              style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Wyślij</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Do:</Text>
                <TextInput
                  value={to}
                  onChangeText={setTo}
                  placeholder="email@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  style={styles.textInput}
                />
              </View>
            </View>

            {!showCcBcc && (
              <View style={styles.addCcBccContainer}>
                <TouchableOpacity
                  onPress={() => setShowCcBcc(true)}
                  disabled={isLoading}
                >
                  <Text style={styles.addCcBccText}>+ Dodaj DW/UDW</Text>
                </TouchableOpacity>
              </View>
            )}

            {showCcBcc && (
              <View style={styles.fieldContainer}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>DW:</Text>
                  <TextInput
                    value={cc}
                    onChangeText={setCc}
                    placeholder="email1@example.com, email2@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            {showCcBcc && (
              <View style={styles.fieldContainer}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>UDW:</Text>
                  <TextInput
                    value={bcc}
                    onChangeText={setBcc}
                    placeholder="email1@example.com, email2@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Temat:</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Temat wiadomości"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="sentences"
                  editable={!isLoading}
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.bodyContainer}>
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
                style={styles.bodyInput}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
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
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  fieldContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldLabel: {
    width: 64,
    color: '#4B5563',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  addCcBccContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addCcBccText: {
    color: '#2563EB',
    fontSize: 16,
  },
  bodyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bodyInput: {
    minHeight: 200,
    color: '#111827',
    fontSize: 16,
    textAlignVertical: 'top',
  },
});

