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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type EventComposerData = {
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  isAllDay?: boolean;
  attendees?: string[];
};

type EventComposerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: {
    calendarId: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  }) => Promise<void>;
  initialData?: EventComposerData;
  isLoading?: boolean;
};

export function EventComposerModal({
  visible,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}: EventComposerModalProps) {
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 3600000));
  const [attendees, setAttendees] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setSummary(initialData.summary || '');
      setDescription(initialData.description || '');
      setLocation(initialData.location || '');
      setIsAllDay(initialData.isAllDay || false);
      setAttendees(initialData.attendees?.join(', ') || '');

      if (initialData.startDateTime) {
        setStartDate(new Date(initialData.startDateTime));
      }
      if (initialData.endDateTime) {
        setEndDate(new Date(initialData.endDateTime));
      } else if (initialData.startDateTime) {
        setEndDate(new Date(new Date(initialData.startDateTime).getTime() + 3600000));
      }
    }
  }, [initialData, visible]);

  const formatDateTime = (date: Date): string => {
    if (isAllDay) {
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSave = async () => {
    if (!summary.trim()) {
      Alert.alert('Błąd', 'Pole "Tytuł" jest wymagane');
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const start = isAllDay
      ? { date: startDate.toISOString().split('T')[0], timeZone }
      : { dateTime: startDate.toISOString(), timeZone };
    const end = isAllDay
      ? { date: endDate.toISOString().split('T')[0], timeZone }
      : { dateTime: endDate.toISOString(), timeZone };

    const eventData = {
      calendarId: 'primary',
      summary: summary.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      start,
      end,
      attendees: attendees.trim()
        ? attendees.split(',').map((e) => ({ email: e.trim() }))
        : undefined,
    };

    console.log('[EventComposerModal] Saving event data:', eventData);

    try {
      await onSave(eventData);
      handleClose();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleClose = () => {
    setSummary('');
    setDescription('');
    setLocation('');
    setIsAllDay(false);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 3600000));
    setAttendees('');
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
            <Text style={styles.headerTitle}>Nowe wydarzenie</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Dodaj</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Tytuł:</Text>
                <TextInput
                  value={summary}
                  onChangeText={setSummary}
                  placeholder="Nazwa wydarzenia"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="sentences"
                  editable={!isLoading}
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Miejsce:</Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Miejsce wydarzenia"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="sentences"
                  editable={!isLoading}
                  style={styles.textInput}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Cały dzień:</Text>
                <Switch
                  value={isAllDay}
                  onValueChange={setIsAllDay}
                  disabled={isLoading}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Rozpoczęcie:</Text>
                <TextInput
                  value={formatDateTime(startDate)}
                  placeholder={isAllDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:MM'}
                  placeholderTextColor="#9CA3AF"
                  editable={false}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  onPress={() => {
                    const now = new Date();
                    const newDate = new Date(startDate);
                    newDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
                    if (!isAllDay) {
                      newDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                    }
                    setStartDate(newDate);
                    if (newDate > endDate) {
                      setEndDate(new Date(newDate.getTime() + 3600000));
                    }
                  }}
                  style={styles.nowButton}
                >
                  <Text style={styles.nowButtonText}>Teraz</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Zakończenie:</Text>
                <TextInput
                  value={formatDateTime(endDate)}
                  placeholder={isAllDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:MM'}
                  placeholderTextColor="#9CA3AF"
                  editable={false}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  onPress={() => {
                    const newDate = new Date(startDate.getTime() + 3600000);
                    setEndDate(newDate);
                  }}
                  style={styles.nowButton}
                >
                  <Text style={styles.nowButtonText}>+1h</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Uczestnicy:</Text>
                <TextInput
                  value={attendees}
                  onChangeText={setAttendees}
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

            <View style={styles.descriptionContainer}>
              <Text style={styles.fieldLabel}>Opis:</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

