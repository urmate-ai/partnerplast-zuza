import React from 'react';
import {
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModalHeader } from './ModalHeader.component';
import { EmailFormFields } from './EmailFormFields.component';
import { useEmailForm } from '../hooks/useEmailForm.hook';
import type { EmailComposerModalProps } from '../types/email.types';

export function EmailComposerModal({
  visible,
  onClose,
  onSend,
  initialData,
  isLoading = false,
}: EmailComposerModalProps) {
  const {
    to,
    subject,
    body,
    cc,
    bcc,
    showCcBcc,
    setTo,
    setSubject,
    setBody,
    setCc,
    setBcc,
    setShowCcBcc,
    handleSend,
    handleClose,
  } = useEmailForm({
    initialData,
    visible,
    onSend,
    onClose,
  });

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
          <ModalHeader
            title="Nowy email"
            onClose={handleClose}
            onAction={handleSend}
            actionLabel="Wyślij"
            isLoading={isLoading}
            actionDisabled={isLoading}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <EmailFormFields
              to={to}
              subject={subject}
              body={body}
              cc={cc}
              bcc={bcc}
              showCcBcc={showCcBcc}
              isLoading={isLoading}
              onToChange={setTo}
              onSubjectChange={setSubject}
              onBodyChange={setBody}
              onCcChange={setCc}
              onBccChange={setBcc}
              onShowCcBcc={() => setShowCcBcc(true)}
            />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});

