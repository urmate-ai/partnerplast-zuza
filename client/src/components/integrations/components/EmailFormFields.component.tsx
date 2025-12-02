import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { FormField } from './FormField.component';

interface EmailFormFieldsProps {
  to: string;
  subject: string;
  body: string;
  cc: string;
  bcc: string;
  showCcBcc: boolean;
  isLoading: boolean;
  onToChange: (text: string) => void;
  onSubjectChange: (text: string) => void;
  onBodyChange: (text: string) => void;
  onCcChange: (text: string) => void;
  onBccChange: (text: string) => void;
  onShowCcBcc: () => void;
}

export function EmailFormFields({
  to,
  subject,
  body,
  cc,
  bcc,
  showCcBcc,
  isLoading,
  onToChange,
  onSubjectChange,
  onBodyChange,
  onCcChange,
  onBccChange,
  onShowCcBcc,
}: EmailFormFieldsProps) {
  return (
    <>
      <FormField
        label="Do:"
        value={to}
        onChangeText={onToChange}
        placeholder="email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      {!showCcBcc && (
        <View style={styles.addCcBccContainer}>
          <TouchableOpacity onPress={onShowCcBcc} disabled={isLoading}>
            <Text style={styles.addCcBccText}>+ Dodaj DW/UDW</Text>
          </TouchableOpacity>
        </View>
      )}

      {showCcBcc && (
        <FormField
          label="DW:"
          value={cc}
          onChangeText={onCcChange}
          placeholder="email1@example.com, email2@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      )}

      {showCcBcc && (
        <FormField
          label="UDW:"
          value={bcc}
          onChangeText={onBccChange}
          placeholder="email1@example.com, email2@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      )}

      <FormField
        label="Temat:"
        value={subject}
        onChangeText={onSubjectChange}
        placeholder="Temat wiadomości"
        autoCapitalize="sentences"
        editable={!isLoading}
      />

      <View style={styles.bodyContainer}>
        <TextInput
          value={body}
          onChangeText={onBodyChange}
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
    </>
  );
}

const styles = StyleSheet.create({
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

