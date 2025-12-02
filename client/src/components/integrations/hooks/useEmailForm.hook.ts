import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import type { EmailComposerData, EmailFormData } from '../types/email.types';
import { parseEmailList, validateEmail, validateEmailList } from '../utils/email.utils';

type UseEmailFormOptions = {
  initialData?: EmailComposerData;
  visible: boolean;
  onSend: (emailData: EmailFormData) => Promise<void>;
  onClose: () => void;
};

export function useEmailForm({
  initialData,
  visible,
  onSend,
  onClose,
}: UseEmailFormOptions) {
  const [to, setTo] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [showCcBcc, setShowCcBcc] = useState<boolean>(false);

  useEffect(() => {
    if (initialData && visible) {
      setTo(initialData.to || '');
      setSubject(initialData.subject || '');
      setBody(initialData.body || '');
      setCc(initialData.cc?.join(', ') || '');
      setBcc(initialData.bcc?.join(', ') || '');
      setShowCcBcc(Boolean(initialData.cc?.length || initialData.bcc?.length));
    }
  }, [initialData, visible]);

  const resetForm = useCallback(() => {
    setTo('');
    setSubject('');
    setBody('');
    setCc('');
    setBcc('');
    setShowCcBcc(false);
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!to.trim()) {
      Alert.alert('Błąd', 'Pole "Do" jest wymagane');
      return false;
    }

    if (!validateEmail(to.trim())) {
      Alert.alert('Błąd', 'Nieprawidłowy adres email w polu "Do"');
      return false;
    }

    if (!subject.trim()) {
      Alert.alert('Błąd', 'Pole "Temat" jest wymagane');
      return false;
    }

    if (!body.trim()) {
      Alert.alert('Błąd', 'Treść wiadomości jest wymagana');
      return false;
    }

    const ccEmails = parseEmailList(cc);
    if (ccEmails.length > 0) {
      const ccValidation = validateEmailList(ccEmails);
      if (!ccValidation.isValid) {
        Alert.alert(
          'Błąd',
          `Nieprawidłowe adresy email w polu DW: ${ccValidation.invalidEmails.join(', ')}`,
        );
        return false;
      }
    }

    const bccEmails = parseEmailList(bcc);
    if (bccEmails.length > 0) {
      const bccValidation = validateEmailList(bccEmails);
      if (!bccValidation.isValid) {
        Alert.alert(
          'Błąd',
          `Nieprawidłowe adresy email w polu UDW: ${bccValidation.invalidEmails.join(', ')}`,
        );
        return false;
      }
    }

    return true;
  }, [to, subject, body, cc, bcc]);

  const handleSend = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const emailData: EmailFormData = {
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
      cc: parseEmailList(cc),
      bcc: parseEmailList(bcc),
    };

    if (emailData.cc?.length === 0) {
      delete emailData.cc;
    }
    if (emailData.bcc?.length === 0) {
      delete emailData.bcc;
    }

    try {
      await onSend(emailData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('[useEmailForm] Error sending email:', error);
      throw error;
    }
  }, [to, subject, body, cc, bcc, validateForm, onSend, resetForm, onClose]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return {
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
  };
}

