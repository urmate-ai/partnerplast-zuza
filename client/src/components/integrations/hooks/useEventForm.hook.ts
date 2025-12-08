import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import type { EventComposerData, EventFormData } from '../types/event.types';
import {
  formatDateForEvent,
  getDefaultEndDate,
  setToNow,
} from '../utils/date.utils';
import { parseEmailList, validateEmailList } from '../utils/email.utils';

type UseEventFormOptions = {
  initialData?: EventComposerData;
  visible: boolean;
  onSave: (eventData: EventFormData) => Promise<void>;
  onClose: () => void;
};

export function useEventForm({
  initialData,
  visible,
  onSave,
  onClose,
}: UseEventFormOptions) {
  const [summary, setSummary] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(getDefaultEndDate(new Date()));
  const [attendees, setAttendees] = useState<string>('');

  useEffect(() => {
    if (initialData && visible) {
      setSummary(initialData.summary || '');
      setDescription(initialData.description || '');
      setLocation(initialData.location || '');
      setIsAllDay(initialData.isAllDay || false);
      setAttendees(initialData.attendees?.join(', ') || '');

      if (initialData.startDateTime) {
        const start = new Date(initialData.startDateTime);
        setStartDate(start);
        if (initialData.endDateTime) {
          setEndDate(new Date(initialData.endDateTime));
        } else {
          setEndDate(getDefaultEndDate(start));
        }
      }
    }
  }, [initialData, visible]);

  const resetForm = useCallback(() => {
    setSummary('');
    setDescription('');
    setLocation('');
    setIsAllDay(false);
    setStartDate(new Date());
    setEndDate(getDefaultEndDate(new Date()));
    setAttendees('');
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!summary.trim()) {
      Alert.alert('Błąd', 'Pole "Tytuł" jest wymagane');
      return false;
    }

    if (startDate > endDate) {
      Alert.alert('Błąd', 'Data zakończenia musi być późniejsza niż data rozpoczęcia');
      return false;
    }

    const attendeeEmails = parseEmailList(attendees);
    if (attendeeEmails.length > 0) {
      const validation = validateEmailList(attendeeEmails);
      if (!validation.isValid) {
        Alert.alert(
          'Błąd',
          `Nieprawidłowe adresy email uczestników: ${validation.invalidEmails.join(', ')}`,
        );
        return false;
      }
    }

    return true;
  }, [summary, startDate, endDate, attendees]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const eventData: EventFormData = {
      calendarId: 'primary',
      summary: summary.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      start: formatDateForEvent(startDate, isAllDay, timeZone),
      end: formatDateForEvent(endDate, isAllDay, timeZone),
      attendees: parseEmailList(attendees).map((email) => ({ email })),
    };

    if (eventData.attendees?.length === 0) {
      delete eventData.attendees;
    }

    try {
      await onSave(eventData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('[useEventForm] Error saving event:', error);
      throw error;
    }
  }, [
    summary,
    description,
    location,
    startDate,
    endDate,
    isAllDay,
    attendees,
    validateForm,
    onSave,
    resetForm,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleStartDateNow = useCallback(() => {
    const newStartDate = setToNow(startDate, isAllDay);
    setStartDate(newStartDate);
    if (newStartDate > endDate) {
      setEndDate(getDefaultEndDate(newStartDate));
    }
  }, [startDate, endDate, isAllDay]);

  const handleEndDatePlusHour = useCallback(() => {
    setEndDate(getDefaultEndDate(startDate));
  }, [startDate]);

  return {
    // Form state
    summary,
    description,
    location,
    isAllDay,
    startDate,
    endDate,
    attendees,
    // Setters
    setSummary,
    setDescription,
    setLocation,
    setIsAllDay,
    setStartDate,
    setEndDate,
    setAttendees,
    // Handlers
    handleSave,
    handleClose,
    handleStartDateNow,
    handleEndDatePlusHour,
  };
}

