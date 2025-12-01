import { apiClient } from '../shared/utils/api';
import { getApiErrorMessage } from '../shared/types/api.types';

export type GmailConnectionStatus = {
  isConnected: boolean;
  email?: string;
  connectedAt?: string;
  scopes?: string[];
}

export type GmailMessage = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  date: string;
  snippet: string;
  body?: string;
  isUnread: boolean;
}

export type GmailAuthResponse = {
  authUrl: string;
}

export type SendEmailRequest = {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}

export type SendEmailResponse = {
  messageId: string;
  success: boolean;
}

export type GmailContextResponse = {
  context: string;
}

export async function getGmailAuthUrl(): Promise<GmailAuthResponse> {
  try {
    const response = await apiClient.get<GmailAuthResponse>(
      '/integrations/gmail/auth',
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas generowania URL autoryzacji Gmail',
    );
    throw new Error(errorMessage);
  }
}

export async function getGmailStatus(): Promise<GmailConnectionStatus> {
  try {
    const response = await apiClient.get<GmailConnectionStatus>(
      '/integrations/gmail/status',
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania statusu Gmail',
    );
    throw new Error(errorMessage);
  }
}

export async function disconnectGmail(): Promise<void> {
  try {
    await apiClient.delete('/integrations/gmail/disconnect');
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas rozłączania Gmail',
    );
    throw new Error(errorMessage);
  }
}

export async function getGmailMessages(
  maxResults = 10,
): Promise<GmailMessage[]> {
  try {
    const response = await apiClient.get<GmailMessage[]>(
      '/integrations/gmail/messages',
      {
        params: { maxResults },
      },
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania wiadomości Gmail',
    );
    throw new Error(errorMessage);
  }
}

export async function sendEmail(
  emailData: SendEmailRequest,
): Promise<SendEmailResponse> {
  try {
    const response = await apiClient.post<SendEmailResponse>(
      '/integrations/gmail/send',
      emailData,
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas wysyłania emaila',
    );
    throw new Error(errorMessage);
  }
}

export async function getGmailContext(
  maxResults = 20,
): Promise<GmailContextResponse> {
  try {
    const response = await apiClient.get<GmailContextResponse>(
      '/integrations/gmail/context',
      {
        params: { maxResults },
      },
    );
    return response.data;
  } catch (error: unknown) {
    const errorMessage = getApiErrorMessage(
      error,
      'Błąd podczas pobierania kontekstu Gmail',
    );
    throw new Error(errorMessage);
  }
}
