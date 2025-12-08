import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IntentClassifierService {
  private readonly logger = new Logger(IntentClassifierService.name);

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

  private readonly smsKeywords = [
    'sms',
    'esemes',
    'esemesa',
    'esemesem',
    'wiadomość sms',
    'wiadomosc sms',
    'esemesika',
    'wiadomość tekstowa',
    'wiadomosc tekstowa',
  ];

  private readonly simpleGreetings = [
    'cześć',
    'czesc',
    'hej',
    'siema',
    'witaj',
    'dzień dobry',
    'dzien dobry',
    'dobry wieczór',
    'dobry wieczor',
    'jak się masz',
    'jak sie masz',
    'co słychać',
    'co slychac',
    'jak leci',
  ];

  private readonly searchKeywords = [
    'znajdź',
    'znajdz',
    'wyszukaj',
    'poszukaj',
    'sprawdź',
    'sprawdz',
    'co to jest',
    'kim jest',
    'kto',
    'kto jest',
    'gdzie jest',
    'kiedy',
    'ile',
    'jaka jest',
    'jaki jest',
    'jakie jest',
    'czym jest',
    'jaki był',
    'jaki byl',
    'jaka była',
    'jaka byla',
    'ostatni',
    'ostatnia',
    'ostatnie',
    'mecz',
    'wynik',
    'wyniki',
    'pogoda',
    'temperatura',
    'kurs',
    'cena',
    'notowania',
    'aktualn',
    'obecn',
    'teraz',
    'dzisiaj',
    'dziś',
    'bieżąc',
    'biezac',
    'najnowsz',
    'śwież',
    'swiez',
  ];

  classifyIntent(transcript: string): {
    needsEmailIntent: boolean;
    needsCalendarIntent: boolean;
    needsSmsIntent: boolean;
    isSimpleGreeting: boolean;
    needsWebSearch: boolean;
    confidence: 'high' | 'medium' | 'low';
  } {
    const lower = transcript.toLowerCase();

    // Najpierw sprawdź, czy potrzebne jest wyszukiwanie w internecie
    const needsWebSearch = this.searchKeywords.some((keyword) =>
      lower.includes(keyword),
    );

    const isSimpleGreeting = this.simpleGreetings.some((greeting) =>
      lower.includes(greeting),
    );

    // Jeśli wykryto potrzebę wyszukiwania, to NIE jest to proste powitanie
    if (isSimpleGreeting && transcript.length < 50 && !needsWebSearch) {
      return {
        needsEmailIntent: false,
        needsCalendarIntent: false,
        needsSmsIntent: false,
        isSimpleGreeting: true,
        needsWebSearch: false,
        confidence: 'high',
      };
    }

    const needsEmailIntent = this.emailKeywords.some((keyword) =>
      lower.includes(keyword),
    );

    const needsSmsIntent = this.smsKeywords.some((keyword) =>
      lower.includes(keyword),
    );

    const needsCalendarIntent =
      lower.includes('kalendarz') ||
      lower.includes('kalendarzu') ||
      (this.calendarKeywords.some((keyword) => lower.includes(keyword)) &&
        (lower.includes('jutro') ||
          lower.includes('dzisiaj') ||
          lower.includes('dzis') ||
          lower.includes('pojutrze') ||
          lower.includes('termin') ||
          lower.includes('spotkanie') ||
          lower.includes('przypomnienie') ||
          /na godzin[ęe]?\s+\d+/.test(lower) ||
          /\d{1,2}:\d{2}/.test(lower)));

    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (needsEmailIntent || needsSmsIntent || needsCalendarIntent) {
      confidence = 'high';
    } else if (needsWebSearch) {
      confidence = 'medium';
    } else if (transcript.length < 20) {
      confidence = 'high';
    }

    return {
      needsEmailIntent,
      needsCalendarIntent,
      needsSmsIntent,
      isSimpleGreeting: false,
      needsWebSearch,
      confidence,
    };
  }
}
