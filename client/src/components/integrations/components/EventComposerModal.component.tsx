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
import { EventFormFields } from './EventFormFields.component';
import { useEventForm } from '../hooks/useEventForm.hook';
import type { EventComposerModalProps } from '../types/event.types';

export function EventComposerModal({
  visible,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: EventComposerModalProps) {
  const {
    summary,
    description,
    location,
    isAllDay,
    startDate,
    endDate,
    attendees,
    setSummary,
    setDescription,
    setLocation,
    setIsAllDay,
    setAttendees,
    handleSave,
    handleClose,
    handleStartDateNow,
    handleEndDatePlusHour,
  } = useEventForm({
    initialData,
    visible,
    onSave,
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
            title="Nowe wydarzenie"
            onClose={handleClose}
            onAction={handleSave}
            actionLabel="Dodaj"
            isLoading={isLoading}
            actionDisabled={isLoading}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <EventFormFields
              summary={summary}
              description={description}
              location={location}
              isAllDay={isAllDay}
              startDate={startDate}
              endDate={endDate}
              attendees={attendees}
              isLoading={isLoading}
              onSummaryChange={setSummary}
              onDescriptionChange={setDescription}
              onLocationChange={setLocation}
              onAttendeesChange={setAttendees}
              onIsAllDayChange={setIsAllDay}
              onStartDateNow={handleStartDateNow}
              onEndDatePlusHour={handleEndDatePlusHour}
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

