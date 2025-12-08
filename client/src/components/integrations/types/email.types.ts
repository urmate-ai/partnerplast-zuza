export type EmailComposerData = {
  to?: string;
  subject?: string;
  body?: string;
  cc?: string[];
  bcc?: string[];
};

export type EmailFormData = {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
};

export interface EmailComposerModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (emailData: EmailFormData) => Promise<void>;
  initialData?: EmailComposerData;
  isLoading?: boolean;
}

