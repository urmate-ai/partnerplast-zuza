import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
  label: string;
  labelWidth?: number;
  containerStyle?: object;
}

export function FormField({
  label,
  labelWidth = 64,
  containerStyle,
  style,
  ...textInputProps
}: FormFieldProps) {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <View style={styles.fieldRow}>
        <Text style={[styles.fieldLabel, { width: labelWidth }]}>{label}</Text>
        <TextInput
          style={[styles.textInput, style]}
          placeholderTextColor="#9CA3AF"
          {...textInputProps}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#4B5563',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
});

