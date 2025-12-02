export type EventComposerData = {
  summary?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  isAllDay?: boolean;
  attendees?: string[];
};

export type EventFormData = {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string }>;
};

export interface EventComposerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: EventFormData) => Promise<void>;
  initialData?: EventComposerData;
  isLoading?: boolean;
}

