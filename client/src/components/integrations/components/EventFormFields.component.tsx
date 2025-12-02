import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { FormField } from './FormField.component';
import { formatDateForDisplay } from '../utils/date.utils';

type EventFormFieldsProps = {
  summary: string;
  description: string;
  location: string;
  isAllDay: boolean;
  startDate: Date;
  endDate: Date;
  attendees: string;
  isLoading: boolean;
  onSummaryChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onLocationChange: (text: string) => void;
  onAttendeesChange: (text: string) => void;
  onIsAllDayChange: (value: boolean) => void;
  onStartDateNow: () => void;
  onEndDatePlusHour: () => void;
};

export function EventFormFields({
  summary,
  description,
  location,
  isAllDay,
  startDate,
  endDate,
  attendees,
  isLoading,
  onSummaryChange,
  onDescriptionChange,
  onLocationChange,
  onAttendeesChange,
  onIsAllDayChange,
  onStartDateNow,
  onEndDatePlusHour,
}: EventFormFieldsProps) {
  return (
    <>
      <FormField
        label="Tytuł:"
        labelWidth={100}
        value={summary}
        onChangeText={onSummaryChange}
        placeholder="Nazwa wydarzenia"
        autoCapitalize="sentences"
        editable={!isLoading}
      />

      <FormField
        label="Miejsce:"
        labelWidth={100}
        value={location}
        onChangeText={onLocationChange}
        placeholder="Miejsce wydarzenia"
        autoCapitalize="sentences"
        editable={!isLoading}
      />

      <View style={styles.switchContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Cały dzień:</Text>
          <Switch value={isAllDay} onValueChange={onIsAllDayChange} disabled={isLoading} />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Rozpoczęcie:</Text>
          <TextInput
            value={formatDateForDisplay(startDate, isAllDay)}
            placeholder={isAllDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:MM'}
            placeholderTextColor="#9CA3AF"
            editable={false}
            style={styles.textInput}
          />
          <TouchableOpacity onPress={onStartDateNow} style={styles.nowButton}>
            <Text style={styles.nowButtonText}>Teraz</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Zakończenie:</Text>
          <TextInput
            value={formatDateForDisplay(endDate, isAllDay)}
            placeholder={isAllDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:MM'}
            placeholderTextColor="#9CA3AF"
            editable={false}
            style={styles.textInput}
          />
          <TouchableOpacity onPress={onEndDatePlusHour} style={styles.nowButton}>
            <Text style={styles.nowButtonText}>+1h</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FormField
        label="Uczestnicy:"
        labelWidth={100}
        value={attendees}
        onChangeText={onAttendeesChange}
        placeholder="email1@example.com, email2@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />

      <View style={styles.descriptionContainer}>
        <Text style={styles.fieldLabel}>Opis:</Text>
        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Opis wydarzenia..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          autoCapitalize="sentences"
          editable={!isLoading}
          style={styles.descriptionInput}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  switchContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    width: 100,
    color: '#4B5563',
    fontSize: 16,
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
    width: 100,
    color: '#4B5563',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  nowButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginLeft: 8,
  },
  nowButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  descriptionInput: {
    marginTop: 8,
    minHeight: 100,
    color: '#111827',
    fontSize: 16,
    textAlignVertical: 'top',
  },
});

