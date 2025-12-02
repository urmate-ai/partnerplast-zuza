import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './services/openai/openai.service';
import { ChatService } from './services/chat/chat.service';
import { GmailService } from '../integrations/services/gmail/gmail.service';
import { CalendarService } from '../integrations/services/calendar/calendar.service';
import type {
  AudioFile,
  VoiceProcessOptions,
  VoiceProcessResult,
  ChatHistoryItem,
  ChatWithMessages,
  EmailIntent,
  CalendarIntent,
  SmsIntent,
} from './types/ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly chatService: ChatService,
    private readonly gmailService: GmailService,
    private readonly calendarService: CalendarService,
  ) {}

  async transcribeAndRespond(
    file: AudioFile,
    userId: string,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    const chatId = await this.chatService.getOrCreateCurrentChat(userId);

    const chat = await this.chatService.getChatById(chatId, userId);

    const messages = chat.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    let gmailContext = '';
    let isGmailConnected = false;
    try {
      const gmailStatus = await this.gmailService.getConnectionStatus(userId);
      isGmailConnected = gmailStatus.isConnected;
      if (gmailStatus.isConnected) {
        gmailContext = await this.gmailService.getMessagesForAiContext(
          userId,
          20,
        );
        this.logger.log(`Gmail context added for user ${userId}`);
      }
    } catch (error) {
      this.logger.warn('Failed to fetch Gmail context:', error);
    }

    let calendarContext = '';
    let isCalendarConnected = false;
    try {
      const calendarStatus =
        await this.calendarService.getConnectionStatus(userId);
      isCalendarConnected = calendarStatus.isConnected;
      if (calendarStatus.isConnected) {
        calendarContext = await this.calendarService.getEventsForAiContext(
          userId,
          7,
        );
        this.logger.log(`Calendar context added for user ${userId}`);
      }
    } catch (error) {
      this.logger.warn('Failed to fetch Calendar context:', error);
    }

    const contextParts = [options.context || ''];
    if (gmailContext) {
      contextParts.push(
        `${gmailContext}\n\nUWAGA: Użytkownik ma połączone konto Gmail. Jeśli poprosi o wysłanie emaila, poinformuj go, że może to zrobić.`,
      );
    }

    if (calendarContext) {
      contextParts.push(
        `${calendarContext}\n\nUWAGA: Użytkownik ma połączone konto Google Calendar. Jeśli zapyta o wydarzenia lub poprosi o dodanie wydarzenia, możesz mu pomóc.`,
      );
    } else {
      contextParts.push(
        '\n\nUWAGA: Użytkownik NIE MA połączonego konta Google Calendar. Jeśli poprosi o dodanie wydarzenia do kalendarza, zapytanie o wydarzenia, lub użyje słów: "dodaj do kalendarza", "zapisz w kalendarzu", "przypomnienie", "termin", "spotkanie" - poinformuj go, że musi najpierw połączyć konto Google Calendar w ustawieniach integracji.',
      );
    }

    const enhancedOptions = {
      ...options,
      context: contextParts.filter(Boolean).join('\n\n'),
    };

    const result = await this.openaiService.transcribeAndRespondWithHistory(
      file,
      messages,
      enhancedOptions,
    );

    let detectedEmailIntent: EmailIntent | undefined;
    let detectedCalendarIntent: CalendarIntent | undefined;
    let detectedSmsIntent: SmsIntent | undefined;

    if (isGmailConnected) {
      try {
        const emailIntent = await this.openaiService.detectEmailIntent(
          result.transcript,
        );
        if (emailIntent.shouldSendEmail) {
          this.logger.log(`Email intent detected for user ${userId}`);
          detectedEmailIntent = {
            shouldSendEmail: emailIntent.shouldSendEmail,
            to: emailIntent.to,
            subject: emailIntent.subject,
            body: emailIntent.body,
          };
        }
      } catch (error) {
        this.logger.warn('Failed to detect email intent:', error);
      }
    }

    if (isCalendarConnected) {
      try {
        const calendarIntent = await this.openaiService.detectCalendarIntent(
          result.transcript,
        );
        this.logger.debug(
          `Calendar intent detection result for user ${userId}: ${JSON.stringify(calendarIntent)}`,
        );
        if (calendarIntent.shouldCreateEvent) {
          this.logger.log(
            `Calendar intent detected for user ${userId}: ${JSON.stringify(calendarIntent)}`,
          );
          detectedCalendarIntent = calendarIntent;
        }
      } catch (error) {
        this.logger.warn('Failed to detect calendar intent:', error);
      }
    } else {
      this.logger.debug(
        `Calendar not connected for user ${userId}, skipping intent detection`,
      );
    }

    try {
      const smsIntent = await this.openaiService.detectSmsIntent(
        result.transcript,
      );
      if (smsIntent.shouldSendSms) {
        this.logger.log(
          `SMS intent detected for user ${userId}: ${JSON.stringify(smsIntent)}`,
        );
        detectedSmsIntent = {
          shouldSendSms: smsIntent.shouldSendSms,
          to: smsIntent.to,
          body: smsIntent.body,
        };
      }
    } catch (error) {
      this.logger.warn('Failed to detect SMS intent:', error);
    }

    const finalReply =
      detectedSmsIntent?.shouldSendSms === true
        ? 'Otwieram dla Ciebie aplikację SMS. Wybierz odbiorcę (jeśli trzeba), uzupełnij treść i wyślij wiadomość samodzielnie.'
        : result.reply;

    const response: VoiceProcessResult = {
      ...result,
      reply: finalReply,
    };

    if (detectedEmailIntent) {
      response.emailIntent = detectedEmailIntent;
    }
    if (detectedCalendarIntent) {
      response.calendarIntent = detectedCalendarIntent;
    }
    if (detectedSmsIntent) {
      response.smsIntent = detectedSmsIntent;
    }

    return response;
  }

  async saveChat(
    userId: string,
    transcript: string,
    reply: string,
  ): Promise<void> {
    return this.chatService.saveChat(userId, transcript, reply);
  }

  async getChatHistory(userId: string): Promise<ChatHistoryItem[]> {
    return this.chatService.getChatHistory(userId);
  }

  async searchChats(userId: string, query: string): Promise<ChatHistoryItem[]> {
    return this.chatService.searchChats(userId, query);
  }

  async getChatById(chatId: string, userId: string): Promise<ChatWithMessages> {
    return this.chatService.getChatById(chatId, userId);
  }

  async createNewChat(userId: string): Promise<{ chatId: string }> {
    const chatId = await this.chatService.createNewChat(userId);
    return { chatId };
  }
}
