import { openAIClient } from './openai-client';
import type { VoiceProcessResult, EmailIntent, CalendarIntent, SmsIntent } from '../../shared/types/ai.types';
import { getGmailMessages, getGmailStatus } from '../gmail.service';
import { getEvents, getCalendarStatus } from '../calendar.service';
import { GmailFormatter } from '../../shared/utils/gmail-formatter.utils';
import { CalendarFormatter } from '../../shared/utils/calendar-formatter.utils';
import { searchNearbyPlaces } from '../places/google-places.service';
import { PlacesFormatter } from '../../shared/utils/places-formatter.utils';

type VoiceProcessOptions = {
  language?: string;
  context?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  onTranscript?: (transcript: string) => void; // Callback wywoływany zaraz po transkrypcji
};

type IntentClassification = {
  needsEmailIntent: boolean;
  needsCalendarIntent: boolean;
  needsSmsIntent: boolean;
  isSimpleGreeting: boolean;
  needsWebSearch: boolean;
  needsPlacesSearch: boolean;
  confidence: 'high' | 'medium' | 'low';
};

const buildSystemPrompt = (userName?: string, context?: string, location?: string, needsWebSearch?: boolean): string => {
  // ZOPTYMALIZOWANY - krótszy prompt = szybsza odpowiedź
  const nameInstruction = userName ? ` Zwracaj się po imieniu "${userName}".` : '';
  
  // Skrócony base prompt (495 → ~200 chars)
  let basePrompt = `ZUZA - asystent głosowy. Odpowiadaj krótko (1-2 zdania), po polsku.${nameInstruction}`;

  // Jeśli użytkownik pyta o wyszukiwanie w internecie, wyjaśnij możliwości
  if (needsWebSearch) {
    basePrompt += ' Możesz wyszukiwać informacje w internecie (pogoda, wiadomości, fakty, kursy walut, wyniki sportowe itp.). Odpowiedz na pytanie użytkownika.';
  }

  if (context) {
    basePrompt = `${basePrompt}\n\nKontekst: ${context}`;
  }

  if (location) {
    basePrompt = `${basePrompt}\n\nLokalizacja: ${location}`;
  }

  return basePrompt;
};

// Używamy LOKALNEJ klasyfikacji - nie wymaga API, instant!
function classifyIntent(transcript: string): IntentClassification {
  return localClassifyIntent(transcript);
}

// SZYBKA lokalna klasyfikacja intencji - nie wymaga API!
function localClassifyIntent(transcript: string): IntentClassification {
  const lower = transcript.toLowerCase().trim();
  
  // Sprawdź najpierw czy są inne intencje
  const hasOtherIntent = 
    lower.includes('wyślij') ||
    lower.includes('napisz') ||
    lower.includes('dodaj') ||
    lower.includes('szukaj') ||
    lower.includes('pogoda') ||
    lower.includes('ile') ||
    lower.includes('gdzie') ||
    lower.includes('numer');
  
  // Proste powitania - INSTANT response (tylko jeśli NIE ma innych intencji)
  const greetingPatterns = [
    /^(cześć|hej|hejka|siema|witaj|dzień dobry|dobry wieczór|dobranoc|yo|elo|hello|hi)[\s!.,?]*$/i,
    /^(cześć|hej|hejka|siema|witaj)\s+(zuza|zuzo)[\s!.,?]*$/i,
    /^(co tam|co słychać|jak leci|co u ciebie|jak się masz)[\s!.,?]*$/i,
  ];
  const isSimpleGreeting = !hasOtherIntent && greetingPatterns.some(p => p.test(lower));
  
  // Email intencje
  const needsEmailIntent = 
    lower.includes('wyślij mail') ||
    lower.includes('wyślij email') ||
    lower.includes('napisz mail') ||
    lower.includes('napisz email') ||
    lower.includes('napisz do') ||
    lower.includes('email do') ||
    lower.includes('mail do');
  
  // Kalendarz intencje
  const needsCalendarIntent = 
    lower.includes('dodaj spotkanie') ||
    lower.includes('dodaj wydarzenie') ||
    lower.includes('zapisz termin') ||
    lower.includes('zaplanuj') ||
    lower.includes('przypomnij') ||
    lower.includes('do kalendarza') ||
    lower.includes('w kalendarzu') ||
    lower.includes('kalendarz');
  
  // SMS intencje - NAPRAWIONE!
  const needsSmsIntent = 
    lower.includes('wyślij sms') ||
    lower.includes('wyślij smsa') ||
    lower.includes('wyślij wiadomość') ||
    lower.includes('wyślij esemes') ||
    lower.includes('napisz sms') ||
    lower.includes('sms do') ||
    lower.includes('sms na numer') ||
    lower.includes('esemes') ||
    // Wykryj numer telefonu w tekście
    (lower.includes('wyślij') && (lower.includes('numer') || /\d{3}[-\s]?\d{3}[-\s]?\d{3}/.test(lower)));
  
  // Miejsca w okolicy
  const needsPlacesSearch =
    lower.includes('ile metrów') ||
    lower.includes('jak daleko') ||
    lower.includes('najbliższ') ||
    lower.includes('gdzie jest') ||
    lower.includes('gdzie znajdę') ||
    lower.includes('restauracj') ||
    lower.includes('sklep') ||
    lower.includes('apteka') ||
    lower.includes('kawiarni') ||
    lower.includes('bar ') ||
    lower.includes('bank') ||
    lower.includes('szpital') ||
    lower.includes('stacj');

  // Web search - NAPRAWIONE!
  const needsWebSearch =
    (lower.includes('pogoda') ||
      lower.includes('temperatura') ||
      lower.includes('wynik') ||
      lower.includes('kurs') ||
      lower.includes('wiadomości') ||
      lower.includes('wydarzenia') ||
      lower.includes('szukaj') ||
      lower.includes('znajdź') ||
      lower.includes('internet') ||
      lower.includes('google') ||
      lower.includes('wyszukaj') ||
      lower.includes('sprawdź') ||
      lower.includes('co to jest') ||
      lower.includes('kim jest') ||
      lower.includes('gdzie można') ||
      lower.includes('jak zrobić') ||
      lower.includes('umiesz szukać') ||
      lower.includes('umiesz wyszukiwać') ||
      lower.includes('wiadomo')) &&
    !needsPlacesSearch;

  return {
    needsEmailIntent,
    needsCalendarIntent,
    needsSmsIntent,
    isSimpleGreeting,
    needsWebSearch,
    needsPlacesSearch,
    confidence: isSimpleGreeting ? 'high' : 'medium',
  };
}

export async function transcribeAndRespond(
  audioUri: string,
  userId: string,
  options: VoiceProcessOptions = {},
): Promise<VoiceProcessResult> {
  const totalStartTime = performance.now();
  const stageTimings: Record<string, number> = {};
  
  console.log(`[PERF] 🎯 ========================================`);
  console.log(`[PERF] 🎯 START transcribeAndRespond | audioUri: ${audioUri.substring(0, 50)}... | timestamp: ${new Date().toISOString()}`);
  console.log(`[PERF] 🎯 ========================================`);
  
  // 1. Transkrypcja (1-3s - GŁÓWNE wąskie gardło, nie da się przyspieszyć)
  const transcriptionStartTime = performance.now();
  console.log(`[PERF] 📝 [ETAP 1/6] START transcription | timestamp: ${new Date().toISOString()}`);
  
  const transcript = await openAIClient.transcribeAudio(
    audioUri,
    options.language,
  );
  
  const transcriptionDuration = performance.now() - transcriptionStartTime;
  stageTimings.transcription = transcriptionDuration;
  console.log(`[PERF] ✅ [ETAP 1/6] END transcription | ⏱️ CZAS: ${transcriptionDuration.toFixed(2)}ms (${(transcriptionDuration/1000).toFixed(2)}s) | transcript: "${transcript.trim()}" | timestamp: ${new Date().toISOString()}`);

  // Wywołaj callback z transkrypcją - użytkownik zobaczy ją od razu!
  if (options.onTranscript) {
    try {
      options.onTranscript(transcript.trim());
    } catch (error) {
      console.error('[voice-ai] Error in onTranscript callback:', error);
    }
  }

  // 2. Lokalna klasyfikacja (<1ms)
  const classificationStartTime = performance.now();
  console.log(`[PERF] 🔍 [ETAP 2/6] START intent classification | timestamp: ${new Date().toISOString()}`);
  
  const intentClass = classifyIntent(transcript);
  
  const classificationDuration = performance.now() - classificationStartTime;
  stageTimings.classification = classificationDuration;
  console.log(`[PERF] ✅ [ETAP 2/6] END intent classification | ⏱️ CZAS: ${classificationDuration.toFixed(2)}ms | intent:`, JSON.stringify(intentClass), `| timestamp: ${new Date().toISOString()}`);

  // 3. FAST PATH dla prostych powitań - pomiń historię i kontekst!
  if (intentClass.isSimpleGreeting && intentClass.confidence === 'high') {
    console.log(`[PERF] ⚡ [FAST PATH] Simple greeting detected | timestamp: ${new Date().toISOString()}`);
    
    const fastPathStartTime = performance.now();
    // Ultra-krótki prompt dla fast path
    const systemPrompt = 'ZUZA - asystent. Odpowiedz krótko na powitanie.';
    
    console.log(`[PERF] 💬 [ETAP 3/3] START chat completion (fast path) | model: gpt-4.1-nano | max_tokens: 40 | temperature: 0.9 | timestamp: ${new Date().toISOString()}`);
    
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: transcript },
      ],
      max_tokens: 40, // Zmniejszone z 50
      temperature: 0.9, // Wyższa = szybsza odpowiedź
    });
    
    const fastPathDuration = performance.now() - fastPathStartTime;
    stageTimings.fastPathCompletion = fastPathDuration;
    const reply = completion.choices[0]?.message?.content?.trim() || 'Cześć!';
    
    console.log(`[PERF] ✅ [ETAP 3/3] END chat completion (fast path) | ⏱️ CZAS: ${fastPathDuration.toFixed(2)}ms (${(fastPathDuration/1000).toFixed(2)}s) | reply length: ${reply.length} | timestamp: ${new Date().toISOString()}`);
    
    const totalDuration = performance.now() - totalStartTime;
    console.log(`[PERF] 🎯 ========================================`);
    console.log(`[PERF] 🎯 END transcribeAndRespond (FAST PATH)`);
    console.log(`[PERF] 🎯 ========================================`);
    console.log(`[PERF] 📊 PODSUMOWANIE CZASÓW:`);
    console.log(`[PERF]   1. Transkrypcja:     ${stageTimings.transcription.toFixed(2)}ms (${((stageTimings.transcription/totalDuration)*100).toFixed(1)}%)`);
    console.log(`[PERF]   2. Klasyfikacja:     ${stageTimings.classification.toFixed(2)}ms (${((stageTimings.classification/totalDuration)*100).toFixed(1)}%)`);
    console.log(`[PERF]   3. Chat completion:  ${stageTimings.fastPathCompletion.toFixed(2)}ms (${((stageTimings.fastPathCompletion/totalDuration)*100).toFixed(1)}%)`);
    console.log(`[PERF]   ─────────────────────────────────────`);
    console.log(`[PERF]   ⏱️  CAŁKOWITY CZAS:   ${totalDuration.toFixed(2)}ms (${(totalDuration/1000).toFixed(2)}s)`);
    console.log(`[PERF] 🎯 ========================================`);
    
    return { transcript, reply };
  }

  // 4. Dla złożonych zapytań - pobierz kontekst równolegle (BEZ historii czatu!)
  console.log(`[PERF] 📦 [ETAP 3/6] START context fetching (parallel) | needsEmail: ${intentClass.needsEmailIntent} | needsCalendar: ${intentClass.needsCalendarIntent} | timestamp: ${new Date().toISOString()}`);
  const contextStartTime = performance.now();
  
  const [gmailContextResult, calendarContextResult, placesContextResult] = await Promise.all([
    intentClass.needsEmailIntent
      ? (() => {
          const gmailStartTime = performance.now();
          console.log(`[PERF] 📧 START Gmail context fetch | timestamp: ${new Date().toISOString()}`);
          return Promise.all([
            getGmailStatus().catch(() => ({ isConnected: false })),
            getGmailMessages(20).catch(() => []),
          ])
            .then(([status, messages]) => {
              const gmailDuration = performance.now() - gmailStartTime;
              if (status.isConnected && messages.length > 0) {
                const context = GmailFormatter.formatForAiContext(messages);
                console.log(`[PERF] ✅ END Gmail context fetch | duration: ${gmailDuration.toFixed(2)}ms | messages: ${messages.length} | context length: ${context.length} | timestamp: ${new Date().toISOString()}`);
                return {
                  context,
                  isConnected: true,
                };
              }
              console.log(`[PERF] ⚠️ END Gmail context fetch (empty) | duration: ${gmailDuration.toFixed(2)}ms | connected: ${status.isConnected} | timestamp: ${new Date().toISOString()}`);
              return { context: null, isConnected: false };
            })
            .catch((e) => {
              console.log(`[PERF] ❌ ERROR Gmail context fetch | error: ${e.message} | timestamp: ${new Date().toISOString()}`);
              return { context: null, isConnected: false };
            });
        })()
      : Promise.resolve({ context: null, isConnected: false }),
          
    intentClass.needsCalendarIntent
      ? (() => {
          const calendarStartTime = performance.now();
          console.log(`[PERF] 📅 START Calendar context fetch | timestamp: ${new Date().toISOString()}`);
          return Promise.all([
            getCalendarStatus().catch(() => ({ isConnected: false })),
            (() => {
              const now = new Date();
              const timeMin = now.toISOString();
              const timeMax = new Date(
                now.getTime() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString();
              return getEvents({
                calendarId: 'primary',
                timeMin,
                timeMax,
                maxResults: 20,
              }).catch(() => []);
            })(),
          ])
            .then(([status, events]) => {
              const calendarDuration = performance.now() - calendarStartTime;
              if (status.isConnected && events.length > 0) {
                const context = CalendarFormatter.formatForAiContext(events, 7);
                console.log(`[PERF] ✅ END Calendar context fetch | duration: ${calendarDuration.toFixed(2)}ms | events: ${events.length} | context length: ${context.length} | timestamp: ${new Date().toISOString()}`);
                return {
                  context,
                  isConnected: true,
                };
              }
              console.log(`[PERF] ⚠️ END Calendar context fetch (empty) | duration: ${calendarDuration.toFixed(2)}ms | connected: ${status.isConnected} | timestamp: ${new Date().toISOString()}`);
              return { context: null, isConnected: false };
            })
            .catch((e) => {
              console.log(`[PERF] ❌ ERROR Calendar context fetch | error: ${e.message} | timestamp: ${new Date().toISOString()}`);
              return { context: null, isConnected: false };
            });
        })()
      : Promise.resolve({ context: null, isConnected: false }),
    
    intentClass.needsPlacesSearch && options.latitude && options.longitude
      ? (() => {
          const placesStartTime = performance.now();
          console.log(`[PERF] 📍 START Places search | lat: ${options.latitude} | lng: ${options.longitude} | query: "${transcript}" | timestamp: ${new Date().toISOString()}`);
          return searchNearbyPlaces({
            latitude: options.latitude,
            longitude: options.longitude,
            query: transcript, // Użyj transkrypcji jako query
            radius: 5000,
            maxResults: 5,
          })
            .then((places) => {
              const placesDuration = performance.now() - placesStartTime;
              if (places.length > 0) {
                const context = PlacesFormatter.formatForAiContext(places);
                console.log(`[PERF] ✅ END Places search | duration: ${placesDuration.toFixed(2)}ms | places: ${places.length} | context length: ${context.length} | timestamp: ${new Date().toISOString()}`);
                return { context, places };
              }
              console.log(`[PERF] ⚠️ END Places search (empty) | duration: ${placesDuration.toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);
              return { context: null, places: [] };
            })
            .catch((e) => {
              console.log(`[PERF] ❌ ERROR Places search | error: ${e.message} | timestamp: ${new Date().toISOString()}`);
              return { context: null, places: [] };
            });
        })()
      : Promise.resolve({ context: null, places: [] }),
  ]);
  
  const contextDuration = performance.now() - contextStartTime;
  stageTimings.contextFetching = contextDuration;
  console.log(`[PERF] ✅ [ETAP 3/6] END context fetching (parallel) | ⏱️ CZAS: ${contextDuration.toFixed(2)}ms (${(contextDuration/1000).toFixed(2)}s) | timestamp: ${new Date().toISOString()}`);

  const isGmailConnected = gmailContextResult.isConnected;
  const isCalendarConnected = calendarContextResult.isConnected;
  
  let context = options.context;
  if (gmailContextResult.context) {
    context = `${context || ''}\n\n${gmailContextResult.context}`;
  }
  if (calendarContextResult.context) {
    context = `${context || ''}\n\n${calendarContextResult.context}`;
  }
  if (placesContextResult?.context) {
    context = `${context || ''}\n\n${placesContextResult.context}`;
  }

  const systemPrompt = buildSystemPrompt(undefined, context, options.location, intentClass.needsWebSearch);
  
  // BEZ historii czatu - każde zapytanie jest niezależne (szybsze!)
  const allMessages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: transcript },
  ];

  const systemPromptLength = systemPrompt.length;
  const userMessageLength = transcript.length;
  const totalPromptTokens = Math.ceil((systemPromptLength + userMessageLength) / 4); // ~4 chars per token
  
  console.log(`[PERF] 📊 [ETAP 4/6] Prompt preparation | system: ${systemPromptLength} chars | user: ${userMessageLength} chars | estimated tokens: ~${totalPromptTokens} | needsWebSearch: ${intentClass.needsWebSearch} | timestamp: ${new Date().toISOString()}`);

  const maxTokens = intentClass.needsWebSearch ? 300 : 150;
  const temperature = 0.8;  
  const model = intentClass.needsWebSearch ? 'gpt-5' : 'gpt-4.1-nano';
  
  const completionStartTime = performance.now();
  console.log(`[PERF] 💬 [ETAP 5/6] START chat completion | model: ${model} | max_tokens: ${maxTokens} | temperature: ${temperature} | needsWebSearch: ${intentClass.needsWebSearch} | timestamp: ${new Date().toISOString()}`);
  
  const completion = await openAIClient.chatCompletions({
    model: model,
    messages: allMessages,
    max_tokens: maxTokens,
    temperature: temperature,
  });
  
  const completionDuration = performance.now() - completionStartTime;
  stageTimings.completion = completionDuration;
  const reply = completion.choices[0]?.message?.content?.trim() || 'Przepraszam, nie zrozumiałam.';
  const replyLength = reply.length;
  const estimatedReplyTokens = Math.ceil(replyLength / 4);
  
  console.log(`[PERF] ✅ [ETAP 5/6] END chat completion | ⏱️ CZAS: ${completionDuration.toFixed(2)}ms (${(completionDuration/1000).toFixed(2)}s) | reply length: ${replyLength} chars (~${estimatedReplyTokens} tokens) | timestamp: ${new Date().toISOString()}`);

  // 6. Wykrywanie intencji email/calendar/sms (tylko jeśli potrzebne)
  const intentDetectionStartTime = performance.now();
  const needsIntentDetection = (intentClass.needsEmailIntent && isGmailConnected) || 
                               (intentClass.needsCalendarIntent && isCalendarConnected) || 
                               intentClass.needsSmsIntent;
  
  if (needsIntentDetection) {
    console.log(`[PERF] 🎯 [ETAP 6/6] START intent detection (parallel) | needsEmail: ${intentClass.needsEmailIntent && isGmailConnected} | needsCalendar: ${intentClass.needsCalendarIntent && isCalendarConnected} | needsSms: ${intentClass.needsSmsIntent} | timestamp: ${new Date().toISOString()}`);
  }
  
  const [emailIntent, calendarIntent, smsIntent] = await Promise.all([
    intentClass.needsEmailIntent && isGmailConnected
      ? detectEmailIntent(transcript)
      : Promise.resolve(undefined),
    intentClass.needsCalendarIntent && isCalendarConnected
      ? detectCalendarIntent(transcript)
      : Promise.resolve(undefined),
    intentClass.needsSmsIntent ? detectSmsIntent(transcript) : Promise.resolve(undefined),
  ]);
  
  if (needsIntentDetection) {
    const intentDetectionDuration = performance.now() - intentDetectionStartTime;
    stageTimings.intentDetection = intentDetectionDuration;
    console.log(`[PERF] ✅ [ETAP 6/6] END intent detection | ⏱️ CZAS: ${intentDetectionDuration.toFixed(2)}ms (${(intentDetectionDuration/1000).toFixed(2)}s) | email: ${emailIntent ? 'detected' : 'none'} | calendar: ${calendarIntent ? 'detected' : 'none'} | sms: ${smsIntent ? 'detected' : 'none'} | timestamp: ${new Date().toISOString()}`);
  } else {
    stageTimings.intentDetection = 0;
  }

  const result: VoiceProcessResult = {
    transcript,
    reply: smsIntent?.shouldSendSms
      ? 'Otwieram dla Ciebie aplikację SMS. Wybierz odbiorcę (jeśli trzeba), uzupełnij treść i wyślij wiadomość samodzielnie.'
      : reply,
  };

  if (emailIntent) result.emailIntent = emailIntent;
  if (calendarIntent) result.calendarIntent = calendarIntent;
  if (smsIntent) result.smsIntent = smsIntent;

  const totalDuration = performance.now() - totalStartTime;
  console.log(`[PERF] 🎯 ========================================`);
  console.log(`[PERF] 🎯 END transcribeAndRespond`);
  console.log(`[PERF] 🎯 ========================================`);
  console.log(`[PERF] 📊 PODSUMOWANIE CZASÓW:`);
  console.log(`[PERF]   1. Transkrypcja:      ${stageTimings.transcription.toFixed(2)}ms (${((stageTimings.transcription/totalDuration)*100).toFixed(1)}%)`);
  console.log(`[PERF]   2. Klasyfikacja:       ${stageTimings.classification.toFixed(2)}ms (${((stageTimings.classification/totalDuration)*100).toFixed(1)}%)`);
  console.log(`[PERF]   3. Pobieranie kontekstu: ${stageTimings.contextFetching.toFixed(2)}ms (${((stageTimings.contextFetching/totalDuration)*100).toFixed(1)}%)`);
  console.log(`[PERF]   4. Przygotowanie promptu: <1ms`);
  console.log(`[PERF]   5. Chat completion:    ${stageTimings.completion.toFixed(2)}ms (${((stageTimings.completion/totalDuration)*100).toFixed(1)}%)`);
  console.log(`[PERF]   6. Wykrywanie intencji: ${stageTimings.intentDetection.toFixed(2)}ms (${((stageTimings.intentDetection/totalDuration)*100).toFixed(1)}%)`);
  console.log(`[PERF]   ─────────────────────────────────────`);
  console.log(`[PERF]   ⏱️  CAŁKOWITY CZAS:    ${totalDuration.toFixed(2)}ms (${(totalDuration/1000).toFixed(2)}s)`);
  console.log(`[PERF] 🎯 ========================================`);

  return result;
}

async function detectEmailIntent(transcript: string): Promise<EmailIntent | undefined> {
  try {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś ekspertem w rozpoznawaniu intencji. Odpowiadaj TYLKO czystym JSON bez markdown.',
        },
        {
          role: 'user',
          content: `Użytkownik powiedział: "${transcript}"

Czy użytkownik chce wysłać email? Jeśli tak, wyodrębnij:
- Adres email odbiorcy (to) - jeśli podany wprost
- Imię/nazwisko odbiorcy (to) - jeśli podane
- Temat (subject) - jeśli podany
- Treść (body) - jeśli podana

Odpowiedz w formacie JSON:
{
  "shouldSendEmail": true,
  "to": "adres email lub imię odbiorcy lub null",
  "subject": "temat lub null",
  "body": "treść lub null"
}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) return undefined;

    const intent = JSON.parse(responseText);
    return intent.shouldSendEmail ? intent : undefined;
  } catch (error) {
    console.error('[AI] Failed to detect email intent:', error);
    return undefined;
  }
}

async function detectCalendarIntent(transcript: string): Promise<CalendarIntent | undefined> {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś ekspertem w rozpoznawaniu intencji. Odpowiadaj TYLKO czystym JSON bez markdown.',
        },
        {
          role: 'user',
          content: `Użytkownik powiedział: "${transcript}"

Czy użytkownik chce dodać wydarzenie do kalendarza? Jeśli tak, wyodrębnij:
- Tytuł wydarzenia (summary)
- Opis (description) - jeśli podany
- Miejsce (location) - jeśli podane
- Data i godzina rozpoczęcia (startDateTime) - w formacie ISO 8601
- Data i godzina zakończenia (endDateTime) - w formacie ISO 8601
- Czy cały dzień (isAllDay) - true jeśli nie ma godziny

Dla dat użyj: "jutro" = ${tomorrow.toISOString().split('T')[0]}, "dzisiaj" = ${now.toISOString().split('T')[0]}

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
}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) return undefined;

    const intent = JSON.parse(responseText);
    return intent.shouldCreateEvent ? intent : undefined;
  } catch (error) {
    console.error('[AI] Failed to detect calendar intent:', error);
    return undefined;
  }
}
    
async function detectSmsIntent(transcript: string): Promise<SmsIntent | undefined> {
  try {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś ekspertem w rozpoznawaniu intencji. Odpowiadaj TYLKO czystym JSON bez markdown.',
        },
        {
          role: 'user',
          content: `Użytkownik powiedział: "${transcript}"

Czy użytkownik chce wysłać SMS? Jeśli tak, wyodrębnij:
- Odbiorcę (to) - numer telefonu lub opis odbiorcy
- Treść wiadomości (body)

Odpowiedz w formacie JSON:
{
  "shouldSendSms": true,
  "to": "numer telefonu lub opis odbiorcy lub null",
  "body": "treść wiadomości lub null"
}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) return undefined;

    const intent = JSON.parse(responseText);
    return intent.shouldSendSms ? intent : undefined;
  } catch (error) {
    console.error('[AI] Failed to detect SMS intent:', error);
    return undefined;
  }
}

