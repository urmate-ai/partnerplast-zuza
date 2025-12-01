import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { IntentParser } from '../utils/intent.parser';
import type {
  EmailIntentResult,
  CalendarIntentResult,
  EmailIntentRaw,
  CalendarIntentRaw,
} from '../types/intent.types';

@Injectable()
export class OpenAIIntentDetectionService {
  private readonly logger = new Logger(OpenAIIntentDetectionService.name);
  private readonly openai: OpenAI;
  private readonly emailKeywords = [
    'wyślij',
    'wyslij',
    'napisz',
    'mail',
    'email',
    'e-mail',
    'wiadomość',
    'wiadomosc',
  ];
  private readonly calendarKeywords = [
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

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – intent detection features will not work.',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  async detectEmailIntent(transcript: string): Promise<EmailIntentResult> {
    try {
      if (!this.hasEmailKeywords(transcript)) {
        this.logger.debug(`No email keywords found in: "${transcript}"`);
        return { shouldSendEmail: false };
      }

      const prompt = this.buildEmailIntentPrompt(transcript);
      const raw = await this.callOpenAIForIntent<EmailIntentRaw>(prompt);
      const result = IntentParser.parseEmailIntent(raw);

      this.logger.log(`Email intent result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to detect email intent:', error);
      return { shouldSendEmail: false };
    }
  }

  async detectCalendarIntent(
    transcript: string,
  ): Promise<CalendarIntentResult> {
    try {
      if (!this.hasCalendarKeywords(transcript)) {
        this.logger.debug(`No calendar keywords found in: "${transcript}"`);
        return { shouldCreateEvent: false };
      }

      this.logger.debug(
        `Calendar keywords found in transcript: "${transcript}"`,
      );

      const prompt = this.buildCalendarIntentPrompt(transcript);
      const raw = await this.callOpenAIForIntent<CalendarIntentRaw>(prompt);
      const result = IntentParser.parseCalendarIntent(raw);

      this.logger.log(`Calendar intent result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to detect calendar intent:', error);
      return { shouldCreateEvent: false };
    }
  }

  private hasEmailKeywords(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase();
    return this.emailKeywords.some((keyword) =>
      lowerTranscript.includes(keyword),
    );
  }

  private hasCalendarKeywords(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase();
    return (
      lowerTranscript.includes('kalendarz') ||
      lowerTranscript.includes('kalendarzu') ||
      (this.calendarKeywords.some((keyword) =>
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
          /\d{1,2}:\d{2}/.test(lowerTranscript)))
    );
  }

  private buildEmailIntentPrompt(transcript: string): string {
    return `Użytkownik powiedział: "${transcript}"

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
  }

  private buildCalendarIntentPrompt(transcript: string): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return `Użytkownik powiedział: "${transcript}"

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
  }

  private async callOpenAIForIntent<
    T extends EmailIntentRaw | CalendarIntentRaw,
  >(prompt: string): Promise<T> {
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

    if (!responseText) {
      this.logger.warn('Empty response from intent detection');
      return {} as T;
    }

    this.logger.debug(`Intent detection response: ${responseText}`);
    return JSON.parse(responseText) as T;
  }
}
