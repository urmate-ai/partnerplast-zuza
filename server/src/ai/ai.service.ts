import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './services/openai/openai.service';
import { OpenAIFastResponseService } from './services/openai/openai-fast-response.service';
import { ChatService } from './services/chat/chat.service';
import { GmailService } from '../integrations/services/gmail/gmail.service';
import { CalendarService } from '../integrations/services/calendar/calendar.service';
import { IntentClassifierService } from './services/intent/intent-classifier.service';
import { IntegrationStatusCacheService } from './services/cache/integration-status-cache.service';
import type { ChatMessageHistory, ChatRole } from './types/chat.types';
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
    private readonly fastResponseService: OpenAIFastResponseService,
    private readonly chatService: ChatService,
    private readonly gmailService: GmailService,
    private readonly calendarService: CalendarService,
    private readonly intentClassifier: IntentClassifierService,
    private readonly integrationCache: IntegrationStatusCacheService,
  ) {}

  async transcribeAndRespond(
    file: AudioFile,
    userId: string,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    const transcript = await this.openaiService.transcribeAudio(
      file,
      options.language,
    );

    const intentClass = this.intentClassifier.classifyIntent(transcript);
    this.logger.debug(
      `Intent classification for "${transcript}": ${JSON.stringify(intentClass)}`,
    );

    const chatData = await this.getChatData(userId);
    const { messages } = chatData;

    let context = options.context;
    let isGmailConnected = false;
    let isCalendarConnected = false;

    if (intentClass.needsEmailIntent || intentClass.needsCalendarIntent) {
      const integrationStatuses = await this.getIntegrationStatuses(userId);
      isGmailConnected = integrationStatuses.isGmailConnected;
      isCalendarConnected = integrationStatuses.isCalendarConnected;

      if (isGmailConnected || isCalendarConnected) {
        const contextData = await this.getContextData(userId, intentClass);
        context = this.buildContext(
          options.context,
          contextData.gmailContext,
          contextData.calendarContext,
          isGmailConnected,
          isCalendarConnected,
        );
      }
    }

    let reply: string;
    if (intentClass.isSimpleGreeting && intentClass.confidence === 'high') {
      this.logger.debug(`Using fast response for simple greeting`);
      reply = await this.fastResponseService.generateFast(
        transcript,
        messages,
        context,
        options.location,
      );
    } else if (intentClass.needsWebSearch) {
      this.logger.debug(
        `Using OpenAI GPT-5 with built-in web_search for query`,
      );
      reply = await this.openaiService.generateResponse(
        transcript,
        messages,
        context,
        options.location,
        true,
      );
    } else {
      this.logger.debug(`Using OpenAI GPT-4o-mini for response`);
      reply = await this.openaiService.generateResponse(
        transcript,
        messages,
        context,
        options.location,
        false,
      );
    }

    const [detectedEmailIntent, detectedCalendarIntent, detectedSmsIntent] =
      intentClass.needsEmailIntent ||
      intentClass.needsCalendarIntent ||
      intentClass.needsSmsIntent
        ? await this.detectIntents(
            transcript,
            userId,
            intentClass,
            isGmailConnected,
            isCalendarConnected,
          )
        : [undefined, undefined, undefined];

    const finalReply =
      detectedSmsIntent?.shouldSendSms === true
        ? 'Otwieram dla Ciebie aplikację SMS. Wybierz odbiorcę (jeśli trzeba), uzupełnij treść i wyślij wiadomość samodzielnie.'
        : reply;

    const response: VoiceProcessResult = {
      transcript,
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

  private async getChatData(
    userId: string,
  ): Promise<{ chatId: string; messages: ChatMessageHistory[] }> {
    const chatId = await this.chatService.getOrCreateCurrentChat(userId);
    const chat = await this.chatService.getRecentMessages(chatId, userId, 20);
    const messages: ChatMessageHistory[] = chat.messages.map((msg) => ({
      role: msg.role as ChatRole,
      content: msg.content,
    }));
    return { chatId, messages };
  }

  private async getIntegrationStatuses(userId: string): Promise<{
    isGmailConnected: boolean;
    isCalendarConnected: boolean;
  }> {
    const cached = this.integrationCache.get(userId);
    if (cached) {
      this.logger.debug(`Using cached integration status for user ${userId}`);
      return cached;
    }

    const [gmailStatus, calendarStatus] = await Promise.all([
      this.gmailService.getConnectionStatus(userId).catch((error) => {
        this.logger.warn('Failed to fetch Gmail status:', error);
        return { isConnected: false };
      }),
      this.calendarService.getConnectionStatus(userId).catch((error) => {
        this.logger.warn('Failed to fetch Calendar status:', error);
        return { isConnected: false };
      }),
    ]);

    const result = {
      isGmailConnected: gmailStatus.isConnected,
      isCalendarConnected: calendarStatus.isConnected,
    };

    this.integrationCache.set(
      userId,
      result.isGmailConnected,
      result.isCalendarConnected,
    );

    return result;
  }

  private async getContextData(
    userId: string,
    intentClass: {
      needsEmailIntent: boolean;
      needsCalendarIntent: boolean;
    },
  ): Promise<{ gmailContext: string; calendarContext: string }> {
    const promises: [Promise<string | null>, Promise<string | null>] = [
      intentClass.needsEmailIntent
        ? this.gmailService
            .getConnectionStatus(userId)
            .then((status) =>
              status.isConnected
                ? this.gmailService.getMessagesForAiContext(userId, 20)
                : null,
            )
            .catch((error) => {
              this.logger.warn('Failed to fetch Gmail context:', error);
              return null;
            })
        : Promise.resolve(null),
      intentClass.needsCalendarIntent
        ? this.calendarService
            .getConnectionStatus(userId)
            .then((status) =>
              status.isConnected
                ? this.calendarService.getEventsForAiContext(userId, 7)
                : null,
            )
            .catch((error) => {
              this.logger.warn('Failed to fetch Calendar context:', error);
              return null;
            })
        : Promise.resolve(null),
    ];

    const [gmailContext, calendarContext] = await Promise.all(promises);

    return {
      gmailContext: gmailContext || '',
      calendarContext: calendarContext || '',
    };
  }

  private buildContext(
    baseContext: string | undefined,
    gmailContext: string,
    calendarContext: string,
    isGmailConnected: boolean,
    isCalendarConnected: boolean,
  ): string {
    const contextParts = [baseContext || ''];

    if (gmailContext) {
      contextParts.push(
        `${gmailContext}\n\nUWAGA: Użytkownik ma połączone konto Gmail. Jeśli poprosi o wysłanie emaila, poinformuj go, że może to zrobić.`,
      );
    }

    if (calendarContext) {
      contextParts.push(
        `${calendarContext}\n\nUWAGA: Użytkownik ma połączone konto Google Calendar. Jeśli zapyta o wydarzenia lub poprosi o dodanie wydarzenia, możesz mu pomóc.`,
      );
    } else if (isCalendarConnected) {
      contextParts.push(
        '\n\nUWAGA: Użytkownik ma połączone konto Google Calendar.',
      );
    } else {
      contextParts.push(
        '\n\nUWAGA: Użytkownik NIE MA połączonego konta Google Calendar. Jeśli poprosi o dodanie wydarzenia do kalendarza, zapytanie o wydarzenia, lub użyje słów: "dodaj do kalendarza", "zapisz w kalendarzu", "przypomnienie", "termin", "spotkanie" - poinformuj go, że musi najpierw połączyć konto Google Calendar w ustawieniach integracji.',
      );
    }

    return contextParts.filter(Boolean).join('\n\n');
  }

  private async detectIntents(
    transcript: string,
    userId: string,
    intentClass: {
      needsEmailIntent: boolean;
      needsCalendarIntent: boolean;
      needsSmsIntent: boolean;
    },
    isGmailConnected: boolean,
    isCalendarConnected: boolean,
  ): Promise<
    [EmailIntent | undefined, CalendarIntent | undefined, SmsIntent | undefined]
  > {
    const promises: [
      Promise<EmailIntent | undefined>,
      Promise<CalendarIntent | undefined>,
      Promise<SmsIntent | undefined>,
    ] = [
      intentClass.needsEmailIntent && isGmailConnected
        ? this.openaiService
            .detectEmailIntent(transcript)
            .then((intent) => {
              if (intent.shouldSendEmail) {
                this.logger.log(`Email intent detected for user ${userId}`);
                return {
                  shouldSendEmail: intent.shouldSendEmail,
                  to: intent.to,
                  subject: intent.subject,
                  body: intent.body,
                };
              }
              return undefined;
            })
            .catch((error) => {
              this.logger.warn('Failed to detect email intent:', error);
              return undefined;
            })
        : Promise.resolve(undefined),
      intentClass.needsCalendarIntent && isCalendarConnected
        ? this.openaiService
            .detectCalendarIntent(transcript)
            .then((intent) => {
              if (intent.shouldCreateEvent) {
                this.logger.log(
                  `Calendar intent detected for user ${userId}: ${JSON.stringify(intent)}`,
                );
                return intent;
              }
              return undefined;
            })
            .catch((error) => {
              this.logger.warn('Failed to detect calendar intent:', error);
              return undefined;
            })
        : Promise.resolve(undefined),
      intentClass.needsSmsIntent
        ? this.openaiService
            .detectSmsIntent(transcript)
            .then((intent) => {
              if (intent.shouldSendSms) {
                this.logger.log(
                  `SMS intent detected for user ${userId}: ${JSON.stringify(intent)}`,
                );
                return {
                  shouldSendSms: intent.shouldSendSms,
                  to: intent.to,
                  body: intent.body,
                };
              }
              return undefined;
            })
            .catch((error) => {
              this.logger.warn('Failed to detect SMS intent:', error);
              return undefined;
            })
        : Promise.resolve(undefined),
    ];

    return Promise.all(promises);
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
