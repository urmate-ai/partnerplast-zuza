import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import * as fs from 'node:fs';
import { PromptUtils } from '../utils/prompt.utils';
import {
  extractReplyFromResponse,
  postprocessReply,
} from '../utils/openai.utils';
import type { AudioFile } from '../types/ai.types';
import type {
  VoiceProcessOptions,
  VoiceProcessResult,
  OpenAIConfig,
  OpenAIResponsesClient,
  ResponsesCreateParams,
} from '../types/ai.types';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;
  private readonly config: OpenAIConfig;
  private readonly responsesClient: OpenAIResponsesClient;
  private readonly responseCache = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – AI features will not work.',
      );
    }

    const openai = new OpenAI({ apiKey });
    this.openai = openai;
    this.responsesClient = (
      openai as unknown as {
        responses: OpenAIResponsesClient;
      }
    ).responses;

    this.config = {
      model: 'gpt-5',
      maxTokens: 500,
      temperature: 0.7,
    };
  }

  async transcribeAudio(file: AudioFile, language?: string): Promise<string> {
    if (!file?.path) {
      throw new InternalServerErrorException('Audio file path is missing');
    }

    const filePath: string = file.path as string;
    const originalName: string =
      (file.originalname as string | undefined) || 'audio.m4a';

    try {
      const audioBuffer = fs.readFileSync(filePath);
      const openAiFile = await toFile(audioBuffer, originalName);

      const transcription = await this.openai.audio.transcriptions.create({
        file: openAiFile,
        model: 'whisper-1',
        language,
        response_format: 'text',
      });

      const transcript =
        typeof transcription === 'string'
          ? transcription
          : String(transcription);

      if (!transcript) {
        throw new InternalServerErrorException('Empty transcription result');
      }

      return transcript;
    } finally {
      if (file?.path) {
        this.cleanupFile(String(file.path));
      }
    }
  }

  async generateResponse(
    transcript: string,
    chatHistory: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }> = [],
    context?: string,
    location?: string,
  ): Promise<string> {
    const basePrompt = context ?? PromptUtils.DEFAULT_SYSTEM_PROMPT;
    const systemPrompt = location
      ? `${basePrompt} Aktualna (przybliżona) lokalizacja użytkownika: ${location}.`
      : basePrompt;

    const messages = PromptUtils.buildMessages(
      systemPrompt,
      chatHistory,
      transcript,
    );

    const input = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const cacheKey = JSON.stringify({ systemPrompt, chatHistory, transcript });
    const cached = this.responseCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const requestBody: ResponsesCreateParams = {
      model: this.config.model,
      input,
      reasoning: { effort: 'low' },
      tools: [{ type: 'web_search' }],
    };

    const response = await this.responsesClient.create(requestBody);

    let reply = extractReplyFromResponse(response);

    if (!reply || !reply.trim()) {
      this.logger.error(
        'Empty AI reply, raw response:',
        JSON.stringify(response),
      );
      reply =
        'Przepraszam, nie udało mi się wygenerować odpowiedzi na to pytanie.';
    }

    const finalReply = postprocessReply(reply);

    this.responseCache.set(cacheKey, finalReply);
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value as string;
      this.responseCache.delete(firstKey);
    }

    return finalReply;
  }

  async detectEmailIntent(transcript: string): Promise<{
    shouldSendEmail: boolean;
    to?: string;
    subject?: string;
    body?: string;
  }> {
    try {
      const lowerTranscript = transcript.toLowerCase();
      const emailKeywords = [
        'wyślij',
        'wyslij',
        'napisz',
        'mail',
        'email',
        'e-mail',
        'wiadomość',
        'wiadomosc',
      ];
      const hasEmailKeyword = emailKeywords.some((keyword) =>
        lowerTranscript.includes(keyword),
      );

      if (!hasEmailKeyword) {
        this.logger.debug(`No email keywords found in: "${transcript}"`);
        return { shouldSendEmail: false };
      }

      const prompt = `Użytkownik powiedział: "${transcript}"

Czy użytkownik chce wysłać email? Jeśli tak, wyodrębnij:
- Adres email odbiorcy (to) - jeśli podany wprost, np. "jan@example.com"
- Imię/nazwisko odbiorcy (to) - jeśli podane, np. "do Oliwiera", "do Jana"
- Temat (subject) - jeśli podany
- Treść (body) - jeśli podana

WAŻNE: Jeśli użytkownik mówi "wyślij mail do [imię]" to ZAWSZE shouldSendEmail = true!

Odpowiedz w formacie JSON:
{
  "shouldSendEmail": true,
  "to": "adres email lub imię odbiorcy lub null",
  "subject": "temat lub null",
  "body": "treść lub null"
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Jesteś ekspertem w rozpoznawaniu intencji. Odpowiadaj TYLKO czystym JSON bez markdown.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      this.logger.debug(`Email intent detection response: ${responseText}`);

      if (!responseText) {
        this.logger.warn('Empty response from email intent detection');
        return { shouldSendEmail: false };
      }

      const parsed = JSON.parse(responseText) as {
        shouldSendEmail?: boolean;
        to?: string | null;
        subject?: string | null;
        body?: string | null;
      };
      this.logger.log(`Parsed email intent: ${JSON.stringify(parsed)}`);

      const result = {
        shouldSendEmail: parsed.shouldSendEmail === true,
        to:
          parsed.to && parsed.to !== 'null' && parsed.to !== null
            ? String(parsed.to)
            : undefined,
        subject:
          parsed.subject && parsed.subject !== 'null' && parsed.subject !== null
            ? String(parsed.subject)
            : undefined,
        body:
          parsed.body && parsed.body !== 'null' && parsed.body !== null
            ? String(parsed.body)
            : undefined,
      };

      this.logger.log(`Final email intent result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to detect email intent:', error);
      return { shouldSendEmail: false };
    }
  }

  async detectCalendarIntent(transcript: string): Promise<{
    shouldCreateEvent: boolean;
    summary?: string;
    description?: string;
    location?: string;
    startDateTime?: string;
    endDateTime?: string;
    isAllDay?: boolean;
    attendees?: string[];
  }> {
    try {
      const lowerTranscript = transcript.toLowerCase();
      const calendarKeywords = [
        'dodaj',
        'zapisz',
        'kalendarz',
        'kalendarzu',
        'wydarzenie',
        'spotkanie',
        'termin',
        'przypomnienie',
        'przypom',
        'dentyst',
        'wizyta',
      ];

      const hasCalendarKeyword =
        lowerTranscript.includes('kalendarz') ||
        lowerTranscript.includes('kalendarzu') ||
        (calendarKeywords.some((keyword) =>
          lowerTranscript.includes(keyword),
        ) &&
          (lowerTranscript.includes('jutro') ||
            lowerTranscript.includes('dzisiaj') ||
            lowerTranscript.includes('dzis') ||
            lowerTranscript.includes('pojutrze') ||
            lowerTranscript.includes('termin') ||
            lowerTranscript.includes('spotkanie') ||
            lowerTranscript.includes('przypomnienie') ||
            /na godzin[ęe]?\s+\d+/.test(lowerTranscript) ||
            /\d{1,2}:\d{2}/.test(lowerTranscript)));

      if (!hasCalendarKeyword) {
        this.logger.debug(`No calendar keywords found in: "${transcript}"`);
        return { shouldCreateEvent: false };
      }

      this.logger.debug(
        `Calendar keywords found in transcript: "${transcript}"`,
      );

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const prompt = `Użytkownik powiedział: "${transcript}"

Czy użytkownik chce dodać wydarzenie do kalendarza? Jeśli tak, wyodrębnij:
- Tytuł wydarzenia (summary) - np. "dentysta", "spotkanie z Janem", "wizyta u dentysty"
- Opis (description) - jeśli podany
- Miejsce (location) - jeśli podane
- Data i godzina rozpoczęcia (startDateTime) - w formacie ISO 8601, np. "2025-12-02T17:00:00"
- Data i godzina zakończenia (endDateTime) - w formacie ISO 8601, jeśli podana (domyślnie +1h od start)
- Czy cały dzień (isAllDay) - true jeśli nie ma godziny, false jeśli jest godzina
- Uczestnicy (attendees) - lista emaili jeśli podana

WAŻNE: 
- Jeśli użytkownik mówi "dodaj do kalendarza", "zapisz w kalendarzu", "przypomnienie", "dodaj mi" w kontekście kalendarza to ZAWSZE shouldCreateEvent = true!
- Dla dat użyj: "jutro" = ${tomorrow.toISOString().split('T')[0]}, "dzisiaj" = ${now.toISOString().split('T')[0]}
- Jeśli jest godzina (np. "na 17", "o 17:00"), ustaw isAllDay = false i startDateTime z godziną
- Jeśli nie ma godziny, ustaw isAllDay = true i użyj tylko daty

Odpowiedz w formacie JSON:
{
  "shouldCreateEvent": true,
  "summary": "tytuł lub null",
  "description": "opis lub null",
  "location": "miejsce lub null",
  "startDateTime": "2025-12-02T17:00:00 lub null",
  "endDateTime": "2025-12-02T18:00:00 lub null",
  "isAllDay": false,
  "attendees": ["email1@example.com"] lub null
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Jesteś ekspertem w rozpoznawaniu intencji. Odpowiadaj TYLKO czystym JSON bez markdown.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      this.logger.debug(`Calendar intent detection response: ${responseText}`);

      if (!responseText) {
        this.logger.warn('Empty response from calendar intent detection');
        return { shouldCreateEvent: false };
      }

      const parsed = JSON.parse(responseText) as {
        shouldCreateEvent?: boolean;
        summary?: string | null;
        description?: string | null;
        location?: string | null;
        startDateTime?: string | null;
        endDateTime?: string | null;
        isAllDay?: boolean;
        attendees?: Array<string | null> | null;
      };
      this.logger.log(`Parsed calendar intent: ${JSON.stringify(parsed)}`);

      const result = {
        shouldCreateEvent: parsed.shouldCreateEvent === true,
        summary:
          parsed.summary && parsed.summary !== 'null' && parsed.summary !== null
            ? String(parsed.summary)
            : undefined,
        description:
          parsed.description &&
          parsed.description !== 'null' &&
          parsed.description !== null
            ? String(parsed.description)
            : undefined,
        location:
          parsed.location &&
          parsed.location !== 'null' &&
          parsed.location !== null
            ? String(parsed.location)
            : undefined,
        startDateTime:
          parsed.startDateTime &&
          parsed.startDateTime !== 'null' &&
          parsed.startDateTime !== null
            ? String(parsed.startDateTime)
            : undefined,
        endDateTime:
          parsed.endDateTime &&
          parsed.endDateTime !== 'null' &&
          parsed.endDateTime !== null
            ? String(parsed.endDateTime)
            : undefined,
        isAllDay: parsed.isAllDay === true,
        attendees:
          parsed.attendees && Array.isArray(parsed.attendees)
            ? parsed.attendees
                .filter((a): a is string => a !== null && a !== 'null')
                .map(String)
            : undefined,
      };

      this.logger.log(
        `Final calendar intent result: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to detect calendar intent:', error);
      return { shouldCreateEvent: false };
    }
  }

  async transcribeAndRespond(
    file: AudioFile,
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    try {
      const transcript = await this.transcribeAudio(file, options.language);
      const reply = await this.generateResponse(
        transcript,
        [],
        options.context,
        options.location,
      );
      return { transcript, reply };
    } catch (error) {
      this.logger.error('Failed to process voice input', error as Error);
      throw new InternalServerErrorException('Failed to process voice input');
    }
  }

  async transcribeAndRespondWithHistory(
    file: AudioFile,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    options: VoiceProcessOptions = {},
  ): Promise<VoiceProcessResult> {
    try {
      const transcript = await this.transcribeAudio(file, options.language);
      const reply = await this.generateResponse(
        transcript,
        chatHistory,
        options.context,
        options.location,
      );
      return { transcript, reply };
    } catch (error) {
      this.logger.error(
        'Failed to process voice input with history',
        error as Error,
      );
      throw new InternalServerErrorException('Failed to process voice input');
    }
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const prompt = PromptUtils.generateTitlePrompt(firstMessage);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: PromptUtils.TITLE_GENERATION_SYSTEM_PROMPT,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 30,
        temperature: 0.7,
      });

      const title =
        completion.choices[0]?.message?.content?.trim() ?? 'Nowa rozmowa';
      return title.length > 60 ? title.substring(0, 60) : title;
    } catch (error) {
      this.logger.error('Error generating chat title:', error);
      return 'Nowa rozmowa';
    }
  }

  private cleanupFile(filePath: string | undefined): void {
    if (filePath) {
      fs.unlink(filePath, () => undefined);
    }
  }
}
