import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface IntentClassification {
  needsEmailIntent: boolean;
  needsCalendarIntent: boolean;
  needsSmsIntent: boolean;
  isSimpleGreeting: boolean;
  needsWebSearch: boolean;
  needsPlacesSearch: boolean;
  confidence: 'high' | 'medium' | 'low';
}

@Injectable()
export class AIIntentClassifierService {
  private readonly logger = new Logger(AIIntentClassifierService.name);
  private readonly openai: OpenAI;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – AI intent classification will not work.',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  async classifyIntent(transcript: string): Promise<IntentClassification> {
    if (!this.openai) {
      // Fallback do podstawowej klasyfikacji
      return this.fallbackClassification(transcript);
    }

    try {
      const prompt = this.buildClassificationPrompt(transcript);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Jesteś ekspertem w klasyfikacji intencji użytkowników. Analizujesz zapytania głosowe i określasz, jakiego typu odpowiedzi potrzebują.

Odpowiadaj TYLKO czystym JSON bez markdown, w formacie:
{
  "needsEmailIntent": boolean,
  "needsCalendarIntent": boolean,
  "needsSmsIntent": boolean,
  "isSimpleGreeting": boolean,
  "needsWebSearch": boolean,
  "needsPlacesSearch": boolean,
  "confidence": "high" | "medium" | "low"
}

Zasady klasyfikacji:
- needsPlacesSearch: zapytania o miejsca w okolicy (restauracje, sklepy, stacje, apteki, bary, kawiarnie, atrakcje), odległości ("ile metrów", "jak daleko"), lokalizacje ("gdzie jest", "najbliższy")
- needsWebSearch: zapytania o aktualne informacje z internetu (pogoda, wiadomości, wyniki sportowe, kursy walut, ceny, wydarzenia)
- needsEmailIntent: zapytania o wysłanie emaila ("wyślij mail", "napisz do", "email do")
- needsCalendarIntent: zapytania o dodanie wydarzenia do kalendarza ("dodaj spotkanie", "zapisz termin", "przypomnij")
- needsSmsIntent: zapytania o wysłanie SMS ("wyślij sms", "esemes do")
- isSimpleGreeting: proste powitania bez dodatkowych pytań ("cześć", "hej", "dzień dobry")
- confidence: "high" jeśli jesteś pewny, "medium" jeśli prawdopodobny, "low" jeśli niepewny`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content?.trim();

      if (!responseText) {
        this.logger.warn('Empty response from AI intent classifier');
        return this.fallbackClassification(transcript);
      }

      const classification = JSON.parse(responseText) as IntentClassification;

      // Walidacja
      if (
        typeof classification.needsEmailIntent !== 'boolean' ||
        typeof classification.needsCalendarIntent !== 'boolean' ||
        typeof classification.needsSmsIntent !== 'boolean' ||
        typeof classification.isSimpleGreeting !== 'boolean' ||
        typeof classification.needsWebSearch !== 'boolean' ||
        typeof classification.needsPlacesSearch !== 'boolean' ||
        !['high', 'medium', 'low'].includes(classification.confidence)
      ) {
        this.logger.warn('Invalid classification format from AI');
        return this.fallbackClassification(transcript);
      }

      this.logger.debug(
        `AI classified intent: ${JSON.stringify(classification)}`,
      );

      return classification;
    } catch (error) {
      this.logger.error('Failed to classify intent with AI:', error);
      return this.fallbackClassification(transcript);
    }
  }

  private buildClassificationPrompt(transcript: string): string {
    return `Sklasyfikuj następujące zapytanie użytkownika:

"${transcript}"

Zwróć JSON z klasyfikacją intencji.`;
  }

  private fallbackClassification(transcript: string): IntentClassification {
    const lower = transcript.toLowerCase();

    // Podstawowa heurystyka jako fallback
    const needsPlacesSearch =
      lower.includes('ile metrów') ||
      lower.includes('ile kilometrów') ||
      lower.includes('jak daleko') ||
      lower.includes('odległość') ||
      lower.includes('dystans') ||
      lower.includes('najbliższ') ||
      lower.includes('gdzie jest') ||
      lower.includes('w okolicy') ||
      lower.includes('restauracj') ||
      lower.includes('sklep') ||
      lower.includes('stacja') ||
      lower.includes('apteka') ||
      lower.includes('bar') ||
      lower.includes('kawiarn');

    const needsWebSearch =
      (lower.includes('pogoda') ||
        lower.includes('temperatura') ||
        lower.includes('wynik') ||
        lower.includes('mecz') ||
        lower.includes('kurs') ||
        lower.includes('cena') ||
        lower.includes('aktualn')) &&
      !needsPlacesSearch;

    return {
      needsEmailIntent: false,
      needsCalendarIntent: false,
      needsSmsIntent: false,
      isSimpleGreeting: false,
      needsWebSearch,
      needsPlacesSearch,
      confidence: needsPlacesSearch || needsWebSearch ? 'medium' : 'low',
    };
  }
}
