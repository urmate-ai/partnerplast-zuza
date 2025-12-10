import { openAIClient } from './openai-client';
import { geminiClient } from './gemini-client';
import type { VoiceProcessResult, EmailIntent, CalendarIntent, SmsIntent } from '../../shared/types/ai.types';
import type { ProcessingStatus } from '../../components/home/types/message.types';
import { getGmailStatus, searchGmailMessages, type GmailMessage } from '../gmail.service';
import { getEvents, getCalendarStatus } from '../calendar.service';
import { GmailFormatter } from '../../shared/utils/gmail-formatter.utils';
import { CalendarFormatter } from '../../shared/utils/calendar-formatter.utils';
import { searchNearbyPlaces } from '../places/google-places.service';
import { PlacesFormatter } from '../../shared/utils/places-formatter.utils';
import { getContactsStatus, getAllContacts, findContactByName } from '../contacts.service';
import { ContactsFormatter } from '../../shared/utils/contacts-formatter.utils';

type VoiceProcessOptions = {
  language?: string;
  context?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  onTranscript?: (transcript: string) => void;
  onStatusChange?: (status: ProcessingStatus) => void;
};

type IntentClassification = {
  needsEmailIntent: boolean;
  needsCalendarIntent: boolean;
  needsSmsIntent: boolean;
  needsContactsIntent: boolean;
  isSimpleGreeting: boolean;
  needsWebSearch: boolean;
  needsPlacesSearch: boolean;
  confidence: 'high' | 'medium' | 'low';
};

const buildSystemPrompt = (userName?: string, context?: string, location?: string, needsWebSearch?: boolean, isGmailConnected?: boolean, isContactsAvailable?: boolean): string => {
  const nameInstruction = userName ? ` Zwracaj się po imieniu "${userName}".` : '';
  
  let basePrompt = `ZUZA - asystent głosowy. Nazywasz się Zuza i jesteś kobietą. Odpowiadaj krótko (1-2 zdania), po polsku, używając form żeńskich (np. "sprawdziłam", "znalazłam", "powiedziałam").${nameInstruction}`;

  if (needsWebSearch) {
    basePrompt += ' Możesz wyszukiwać informacje w internecie (pogoda, wiadomości, fakty, kursy walut, wyniki sportowe itp.). Odpowiedz na pytanie użytkownika.';
  }

  if (isGmailConnected) {
    basePrompt += '\n\nWAŻNE: Masz dostęp do skrzynki mailowej użytkownika (Gmail jest połączony). Możesz odpowiadać na pytania o emaile.';
  }

  if (isContactsAvailable) {
    basePrompt += '\n\nWAŻNE: Masz dostęp do kontaktów użytkownika. Możesz odpowiadać na pytania o kontakty, numery telefonów i adresy email.';
  }

  if (context) {
    basePrompt = `${basePrompt}\n\nKontekst: ${context}`;
  }

  if (location) {
    basePrompt = `${basePrompt}\n\nLokalizacja: ${location}`;
  }

  return basePrompt;
};

async function classifyIntent(transcript: string): Promise<IntentClassification> {
  const localResult = localClassifyIntent(transcript);
  
  if (localResult.isSimpleGreeting && localResult.confidence === 'high') {
    return localResult;
  }

  return await aiClassifyIntent(transcript);
}

async function aiClassifyIntent(transcript: string): Promise<IntentClassification> {
  try {
    const systemPrompt = `Jesteś klasyfikatorem intencji. Przeanalizuj wiadomość użytkownika i zwróć JSON z intencjami.
Odpowiedz TYLKO JSON w formacie:
{
  "needsEmailIntent": true/false,
  "needsCalendarIntent": true/false,
  "needsSmsIntent": true/false,
  "needsContactsIntent": true/false,
  "isSimpleGreeting": true/false,
  "needsWebSearch": true/false,
  "needsPlacesSearch": true/false,
  "confidence": "high"/"medium"/"low"
}

Zasady:
- needsEmailIntent: użytkownik chce WYSŁAĆ email/mail LUB SPRAWDZIĆ/CZYTAĆ emaile (np. "pokaż mi maile", "jakie maile przyszły", "jaki mail dostałem", "maile z poniedziałku", "ostatni mail", "wyślij mail", "napisz email")
- needsCalendarIntent: użytkownik chce dodać wydarzenie/spotkanie do kalendarza LUB sprawdzić wydarzenia (np. "dodaj spotkanie", "co mam w kalendarzu", "wydarzenia")
- needsSmsIntent: użytkownik chce wysłać SMS/wiadomość tekstową
- needsContactsIntent: użytkownik pyta o kontakty (np. "jaki numer ma Jan", "znajdź kontakt", "pokaż mi kontakty", "jaki telefon ma Robert", "znajdź numer do", "kontakt do")
- isSimpleGreeting: proste powitanie (cześć, hej, dzień dobry) BEZ innych intencji
- needsWebSearch: użytkownik pyta o informacje z internetu (pogoda, wiadomości, fakty, kursy, aktualne wydarzenia, "kto jest", "kim jest", "aktualnie", "obecnie", "premier", "prezydent", ceny, wydarzenia) - NIE używaj dla zapytań o emaile/kalendarz/kontakty użytkownika
- needsPlacesSearch: użytkownik pyta o miejsca w okolicy (restauracje, sklepy, apteki, odległości)
- confidence: "high" jeśli jesteś pewny, "medium" jeśli prawdopodobny, "low" jeśli niepewny

WAŻNE: Jeśli użytkownik pyta o emaile (np. "pokaż mi maile", "jakie maile", "jaki mail"), ustaw needsEmailIntent: true, NIE needsWebSearch: true.`;

    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript },
      ],
      max_tokens: 150,
      temperature: 0.3, 
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(responseText) as IntentClassification;
    
    return {
      needsEmailIntent: Boolean(parsed.needsEmailIntent),
      needsCalendarIntent: Boolean(parsed.needsCalendarIntent),
      needsSmsIntent: Boolean(parsed.needsSmsIntent),
      needsContactsIntent: Boolean(parsed.needsContactsIntent),
      isSimpleGreeting: Boolean(parsed.isSimpleGreeting),
      needsWebSearch: Boolean(parsed.needsWebSearch),
      needsPlacesSearch: Boolean(parsed.needsPlacesSearch),
      confidence: parsed.confidence || 'medium',
    };
  } catch (error) {
    console.warn('[AI Intent] Classification failed, using local fallback:', error);
    return localClassifyIntent(transcript);
  }
}

function localClassifyIntent(transcript: string): IntentClassification {
  const lower = transcript.toLowerCase().trim();
  
  const hasOtherIntent = 
    lower.includes('wyślij') ||
    lower.includes('napisz') ||
    lower.includes('dodaj') ||
    lower.includes('szukaj') ||
    lower.includes('pogoda') ||
    lower.includes('ile') ||
    lower.includes('gdzie') ||
    lower.includes('numer');
  
  const greetingPatterns = [
    /^(cześć|hej|hejka|siema|witaj|dzień dobry|dobry wieczór|dobranoc|yo|elo|hello|hi)[\s!.,?]*$/i,
    /^(cześć|hej|hejka|siema|witaj)\s+(zuza|zuzo)[\s!.,?]*$/i,
    /^(co tam|co słychać|jak leci|co u ciebie|jak się masz)[\s!.,?]*$/i,
  ];
  const isSimpleGreeting = !hasOtherIntent && greetingPatterns.some(p => p.test(lower));
  
  const needsEmailIntent = 
    lower.includes('wyślij mail') ||
    lower.includes('wyślij email') ||
    lower.includes('napisz mail') ||
    lower.includes('napisz email') ||
    lower.includes('napisz do') ||
    lower.includes('email do') ||
    lower.includes('mail do') ||
    lower.includes('pokaż mi maile') ||
    lower.includes('pokaż maile') ||
    lower.includes('jakie maile') ||
    lower.includes('jaki mail') ||
    lower.includes('maile z') ||
    lower.includes('mail z') ||
    lower.includes('ostatni mail') ||
    lower.includes('ostatnie maile') ||
    lower.includes('dostałem mail') ||
    lower.includes('przyszedł mail') ||
    lower.includes('przyszły maile');
  
  const needsCalendarIntent = 
    lower.includes('dodaj spotkanie') ||
    lower.includes('dodaj wydarzenie') ||
    lower.includes('zapisz termin') ||
    lower.includes('zaplanuj') ||
    lower.includes('przypomnij') ||
    lower.includes('do kalendarza') ||
    lower.includes('w kalendarzu') ||
    lower.includes('kalendarz');
  
  const needsSmsIntent = 
    lower.includes('wyślij sms') ||
    lower.includes('wyślij smsa') ||
    lower.includes('wyślij wiadomość') ||
    lower.includes('wyślij esemes') ||
    lower.includes('napisz sms') ||
    lower.includes('sms do') ||
    lower.includes('sms na numer') ||
    lower.includes('esemes') ||
    (lower.includes('wyślij') && (lower.includes('numer') || /\d{3}[-\s]?\d{3}[-\s]?\d{3}/.test(lower)));
  
  const needsContactsIntent =
    lower.includes('jaki numer') ||
    lower.includes('jaki telefon') ||
    lower.includes('numer do') ||
    lower.includes('telefon do') ||
    lower.includes('kontakt do') ||
    lower.includes('znajdź kontakt') ||
    lower.includes('znajdź numer') ||
    lower.includes('pokaż kontakt') ||
    lower.includes('pokaż kontakty') ||
    lower.includes('jaki kontakt') ||
    lower.includes('kontakty');
  
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
      lower.includes('kto jest') || 
      lower.includes('gdzie można') ||
      lower.includes('jak zrobić') ||
      lower.includes('umiesz szukać') ||
      lower.includes('umiesz wyszukiwać') ||
      lower.includes('wiadomo') ||
      lower.includes('aktualnie') ||
      lower.includes('obecnie') ||
      lower.includes('teraz') ||
      lower.includes('dzisiaj') ||
      lower.includes('premier') ||
      lower.includes('prezydent') ||
      lower.includes('minister') ||
      lower.includes('rząd') ||
      lower.includes('ile kosztuje') ||
      lower.includes('jaka cena') ||
      lower.includes('gdzie kupić') ||
      lower.includes('kiedy') ||
      lower.includes('co się dzieje') ||
      lower.includes('co się stało')) &&
    !needsPlacesSearch;

  return {
    needsEmailIntent,
    needsCalendarIntent,
    needsSmsIntent,
    needsContactsIntent,
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
  
  const transcriptionStartTime = performance.now();
  console.log(`[PERF] 📝 [ETAP 1/6] START transcription | timestamp: ${new Date().toISOString()}`);
    
  console.log(`[PERF] 📝 [ETAP 1/6] START transcription | timestamp: ${new Date().toISOString()}`);
  const transcript = await openAIClient.transcribeAudio(
    audioUri,
    options.language,
  );
  
  const transcriptionDuration = performance.now() - transcriptionStartTime;
  stageTimings.transcription = transcriptionDuration;
  console.log(`[PERF] ✅ [ETAP 1/6] END transcription | ⏱️ CZAS: ${transcriptionDuration.toFixed(2)}ms (${(transcriptionDuration/1000).toFixed(2)}s) | transcript: "${transcript.trim()}" | timestamp: ${new Date().toISOString()}`);

  if (options.onTranscript) {
    try {
      options.onTranscript(transcript.trim());
    } catch (error) {
      console.error('[voice-ai] Error in onTranscript callback:', error);
    }
  }

  const classificationStartTime = performance.now();
  console.log(`[PERF] 🔍 [ETAP 2/6] START intent classification (AI) | timestamp: ${new Date().toISOString()}`);
  
  if (options.onStatusChange) {
    try {
      options.onStatusChange('classifying');
    } catch (error) {
      console.error('[voice-ai] Error in onStatusChange callback:', error);
    }
  }
  
  const intentClass = await classifyIntent(transcript);
  
  const classificationDuration = performance.now() - classificationStartTime;
  stageTimings.classification = classificationDuration;
  console.log(`[PERF] ✅ [ETAP 2/6] END intent classification (AI) | ⏱️ CZAS: ${classificationDuration.toFixed(2)}ms (${(classificationDuration/1000).toFixed(2)}s) | intent:`, JSON.stringify(intentClass), `| timestamp: ${new Date().toISOString()}`);

  if (intentClass.isSimpleGreeting && intentClass.confidence === 'high') {
    console.log(`[PERF] ⚡ [FAST PATH] Simple greeting detected | timestamp: ${new Date().toISOString()}`);
    
    const fastPathStartTime = performance.now();  
    const systemPrompt = 'ZUZA - asystent głosowy. Nazywasz się Zuza i jesteś kobietą. Odpowiedz krótko na powitanie, używając form żeńskich (np. "cześć", "witam").';
    
    console.log(`[PERF] 💬 [ETAP 3/3] START chat completion (fast path) | model: gpt-4.1-nano | max_tokens: 40 | temperature: 0.9 | timestamp: ${new Date().toISOString()}`);
    
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: transcript },
      ],
      max_tokens: 40, 
      temperature: 0.9, 
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

  console.log(`[PERF] 📦 [ETAP 3/6] START context fetching (parallel) | needsEmail: ${intentClass.needsEmailIntent} | needsCalendar: ${intentClass.needsCalendarIntent} | needsContacts: ${intentClass.needsContactsIntent} | needsSms: ${intentClass.needsSmsIntent} | timestamp: ${new Date().toISOString()}`);
  const contextStartTime = performance.now();
  
  const shouldFetchContacts = intentClass.needsContactsIntent || intentClass.needsSmsIntent;
  
  const [gmailContextResult, calendarContextResult, placesContextResult, contactsContextResult] = await Promise.all([
    intentClass.needsEmailIntent
      ? (async () => {
          const gmailStartTime = performance.now();
          console.log(`[PERF] 📧 START Gmail context fetch | timestamp: ${new Date().toISOString()}`);
          
          try {
            const status = await getGmailStatus().catch(() => ({ isConnected: false }));
            
            if (!status.isConnected) {
              console.log(`[PERF] ⚠️ END Gmail context fetch (not connected) | duration: ${(performance.now() - gmailStartTime).toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);
              return { context: null, isConnected: false };
            }

            if (options.onStatusChange) {
              try {
                options.onStatusChange('checking_email');
              } catch (error) {
                console.error('[voice-ai] Error in onStatusChange callback:', error);
              }
            }

            console.log(`[PERF] 🔍 START Gmail query generation | timestamp: ${new Date().toISOString()}`);
            const queryStartTime = performance.now();
            const gmailQueryResult = await generateGmailQuery(transcript);
            const queryDuration = performance.now() - queryStartTime;
            console.log(`[PERF] ✅ END Gmail query generation | duration: ${queryDuration.toFixed(2)}ms | query: "${gmailQueryResult.query || 'in:inbox'}" | hasSender: ${gmailQueryResult.hasSender} | timestamp: ${new Date().toISOString()}`);

            const baseQuery = gmailQueryResult.queryWithoutSender || gmailQueryResult.query || 'in:inbox';
            const messages = await searchGmailMessages(baseQuery, 50).catch(() => []);
            
            console.log(`[PERF] 📧 Fetched ${messages.length} messages from Gmail | timestamp: ${new Date().toISOString()}`);

            let filteredMessages = messages;
            if (gmailQueryResult.hasSender && messages.length > 0) {
              console.log(`[PERF] 🔍 START AI sender filtering | sender hint: "${gmailQueryResult.senderHint}" | timestamp: ${new Date().toISOString()}`);
              const filterStartTime = performance.now();
              filteredMessages = await filterMessagesBySender(messages, gmailQueryResult.senderHint || '', transcript);
              const filterDuration = performance.now() - filterStartTime;
              console.log(`[PERF] ✅ END AI sender filtering | duration: ${filterDuration.toFixed(2)}ms | filtered: ${filteredMessages.length}/${messages.length} | timestamp: ${new Date().toISOString()}`);
            }
            
            const gmailDuration = performance.now() - gmailStartTime;
            if (filteredMessages.length > 0) {
              const context = GmailFormatter.formatForAiContext(filteredMessages);
              console.log(`[PERF] ✅ END Gmail context fetch | duration: ${gmailDuration.toFixed(2)}ms | query: "${baseQuery}" | messages: ${filteredMessages.length} | context length: ${context.length} | timestamp: ${new Date().toISOString()}`);
              return {
                context,
                isConnected: true,
              };
            }
            
            const noMessagesContext = `Sprawdziłem skrzynkę mailową użytkownika używając zapytania: "${baseQuery}". Nie znalazłem żadnych wiadomości spełniających te kryteria w skrzynce odbiorczej. Odpowiedz użytkownikowi, że sprawdziłeś jego skrzynkę mailową, ale nie znalazłeś wiadomości spełniających te kryteria. Możesz zaproponować sprawdzenie szerszego zakresu dat lub innych kryteriów.`;
            console.log(`[PERF] ⚠️ END Gmail context fetch (no messages) | duration: ${gmailDuration.toFixed(2)}ms | query: "${baseQuery}" | timestamp: ${new Date().toISOString()}`);
            return { context: noMessagesContext, isConnected: true };
          } catch (e: any) {
            console.log(`[PERF] ❌ ERROR Gmail context fetch | error: ${e.message} | timestamp: ${new Date().toISOString()}`);
            return { context: null, isConnected: false };
          }
        })()
      : Promise.resolve({ context: null, isConnected: false }),
          
    intentClass.needsCalendarIntent
      ? (async () => {
          const calendarStartTime = performance.now();
          console.log(`[PERF] 📅 START Calendar context fetch | timestamp: ${new Date().toISOString()}`);
          
          try {
            const status = await getCalendarStatus().catch(() => ({ isConnected: false }));
            
            if (!status.isConnected) {
              console.log(`[PERF] ⚠️ END Calendar context fetch (not connected) | duration: ${(performance.now() - calendarStartTime).toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);
              return { context: null, isConnected: false };
            }

            if (options.onStatusChange) {
              try {
                options.onStatusChange('checking_calendar');
              } catch (error) {
                console.error('[voice-ai] Error in onStatusChange callback:', error);
              }
            }

            const now = new Date();
            const timeMin = now.toISOString();
            const timeMax = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString();
            const events = await getEvents({
              calendarId: 'primary',
              timeMin,
              timeMax,
              maxResults: 20,
            }).catch(() => []);

            const calendarDuration = performance.now() - calendarStartTime;
            if (events.length > 0) {
              const context = CalendarFormatter.formatForAiContext(events, 7);
              console.log(`[PERF] ✅ END Calendar context fetch | duration: ${calendarDuration.toFixed(2)}ms | events: ${events.length} | context length: ${context.length} | timestamp: ${new Date().toISOString()}`);
              return {
                context,
                isConnected: true,
              };
            }
            console.log(`[PERF] ⚠️ END Calendar context fetch (empty) | duration: ${calendarDuration.toFixed(2)}ms | connected: ${status.isConnected} | timestamp: ${new Date().toISOString()}`);
            return { context: null, isConnected: false };
          } catch (e: any) {
            console.log(`[PERF] ❌ ERROR Calendar context fetch | error: ${e.message} | timestamp: ${new Date().toISOString()}`);
            return { context: null, isConnected: false };
          }
        })()
      : Promise.resolve({ context: null, isConnected: false }),
    
    intentClass.needsPlacesSearch && options.latitude && options.longitude
      ? (() => {
          const placesStartTime = performance.now();
          console.log(`[PERF] 📍 START Places search | lat: ${options.latitude} | lng: ${options.longitude} | query: "${transcript}" | timestamp: ${new Date().toISOString()}`);
          return searchNearbyPlaces({
            latitude: options.latitude,
            longitude: options.longitude,
            query: transcript, 
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
    
    shouldFetchContacts
      ? (async () => {
          const contactsStartTime = performance.now();
          console.log(`[PERF] 📇 START Contacts context fetch | timestamp: ${new Date().toISOString()}`);
          
          try {
            const status = await getContactsStatus();
            
            if (!status.hasPermission) {
              console.log(`[PERF] ⚠️ END Contacts context fetch (no permission) | duration: ${(performance.now() - contactsStartTime).toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);
              return { context: null, isAvailable: false };
            }

            if (options.onStatusChange) {
              try {
                options.onStatusChange('checking_contacts');
              } catch (error) {
                console.error('[voice-ai] Error in onStatusChange callback:', error);
              }
            }

            const contacts = await getAllContacts();
            
            let relevantContacts = contacts;
            const nameMatch = transcript.match(/(?:jaki|znajdź|pokaż|kontakt|numer|telefon).*?(?:do|ma|ma\s+)?\s*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?)/i);
            if (nameMatch && nameMatch[1]) {
              const searchName = nameMatch[1].trim();
              const foundContact = await findContactByName(searchName);
              if (foundContact) {
                relevantContacts = [foundContact];
                console.log(`[PERF] 🔍 Found specific contact: ${foundContact.name} | timestamp: ${new Date().toISOString()}`);
              } else {
                console.log(`[PERF] ⚠️ Contact "${searchName}" not found, using all contacts | timestamp: ${new Date().toISOString()}`);
              }
            }

            const contactsDuration = performance.now() - contactsStartTime;
            if (relevantContacts.length > 0) {
              const context = ContactsFormatter.formatForAiContext(relevantContacts);
              console.log(`[PERF] ✅ END Contacts context fetch | duration: ${contactsDuration.toFixed(2)}ms | contacts: ${relevantContacts.length} | context length: ${context.length} | timestamp: ${new Date().toISOString()}`);
              return {
                context,
                isAvailable: true,
              };
            }
            console.log(`[PERF] ⚠️ END Contacts context fetch (empty) | duration: ${contactsDuration.toFixed(2)}ms | timestamp: ${new Date().toISOString()}`);
            return { context: null, isAvailable: false };
          } catch (e: any) {
            console.log(`[PERF] ❌ ERROR Contacts context fetch | error: ${e.message} | timestamp: ${new Date().toISOString()}`);
            return { context: null, isAvailable: false };
          }
        })()
      : Promise.resolve({ context: null, isAvailable: false }),
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
  if (contactsContextResult?.context) {
    context = `${context || ''}\n\n${contactsContextResult.context}`;
  }

  const isContactsAvailable = contactsContextResult?.isAvailable || false;
  const systemPrompt = buildSystemPrompt(undefined, context, options.location, intentClass.needsWebSearch, isGmailConnected, isContactsAvailable);
  
  const allMessages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: transcript },
  ];

  const systemPromptLength = systemPrompt.length;
  const userMessageLength = transcript.length;
  const totalPromptTokens = Math.ceil((systemPromptLength + userMessageLength) / 4);  
  
  console.log(`[PERF] 📊 [ETAP 4/6] Prompt preparation | system: ${systemPromptLength} chars | user: ${userMessageLength} chars | estimated tokens: ~${totalPromptTokens} | needsWebSearch: ${intentClass.needsWebSearch} | timestamp: ${new Date().toISOString()}`);

  const maxTokens = intentClass.needsWebSearch ? 1000 : 150;
  
  const useGemini = intentClass.needsWebSearch;
  const model = useGemini ? 'gemini-2.0-flash-exp' : 'gpt-4.1-nano';

  if (options.onStatusChange) {
    try {
      if (intentClass.needsWebSearch) {
        options.onStatusChange('web_searching');
      } else {
        options.onStatusChange('preparing_response');
      }
    } catch (error) {
      console.error('[voice-ai] Error in onStatusChange callback:', error);
    }
  }
  
  const completionStartTime = performance.now();
  console.log(`[PERF] 💬 [ETAP 5/6] START ${useGemini ? 'Gemini (websearch)' : 'chat completion'} | model: ${model} | max_tokens: ${maxTokens} | needsWebSearch: ${intentClass.needsWebSearch} | timestamp: ${new Date().toISOString()}`);
  
  let reply: string;
  
  if (useGemini) {
    const systemMessage = allMessages.find(m => m.role === 'system');
    const userMessage = allMessages.find(m => m.role === 'user');
    
    const response = await geminiClient.generateContent({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemMessage?.content,
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage?.content || '' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.8,
      },
      tools: [{ googleSearch: {} }], 
    });
    
    reply = response.text?.trim() || 'Przepraszam, nie zrozumiałam.';
  } else {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: allMessages,
      max_tokens: maxTokens,
      temperature: 0.8,
    });
    
    reply = completion.choices[0]?.message?.content?.trim() || 'Przepraszam, nie zrozumiałam.';
  }
  
  const completionDuration = performance.now() - completionStartTime;
  stageTimings.completion = completionDuration;
  const replyLength = reply.length;
  const estimatedReplyTokens = Math.ceil(replyLength / 4);
  
  console.log(`[PERF] ✅ [ETAP 5/6] END ${useGemini ? 'Gemini (websearch)' : 'chat completion'} | ⏱️ CZAS: ${completionDuration.toFixed(2)}ms (${(completionDuration/1000).toFixed(2)}s) | reply length: ${replyLength} chars (~${estimatedReplyTokens} tokens) | timestamp: ${new Date().toISOString()}`);

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
    const emailStatus = emailIntent 
      ? (emailIntent.shouldSendEmail ? 'send' : 'read') 
      : 'none';
    console.log(`[PERF] ✅ [ETAP 6/6] END intent detection | ⏱️ CZAS: ${intentDetectionDuration.toFixed(2)}ms (${(intentDetectionDuration/1000).toFixed(2)}s) | email: ${emailStatus} | calendar: ${calendarIntent ? 'detected' : 'none'} | sms: ${smsIntent ? 'detected' : 'none'} | timestamp: ${new Date().toISOString()}`);
  } else {
    stageTimings.intentDetection = 0;
  }
  
  if (options.onStatusChange) {
    try {
      options.onStatusChange(null);
    } catch (error) {
      console.error('[voice-ai] Error in onStatusChange callback:', error);
    }
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

type GmailQueryResult = {
  query: string | null;
  queryWithoutSender?: string | null;
  hasSender: boolean;
  senderHint?: string;
};

async function generateGmailQuery(transcript: string): Promise<GmailQueryResult> {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś ekspertem w tworzeniu zapytań Gmail. Odpowiadaj TYLKO czystym JSON bez markdown.',
        },
        {
          role: 'user',
          content: `Użytkownik powiedział: "${transcript}"

Wygeneruj zapytanie Gmail (Gmail search query) na podstawie tego co użytkownik powiedział.

Dzisiejsza data: ${today}
Wczoraj: ${yesterday.toISOString().split('T')[0]}
Tydzień temu: ${lastWeek.toISOString().split('T')[0]}
Miesiąc temu: ${lastMonth.toISOString().split('T')[0]}

WAŻNE: NIE używaj operatora "from:" w zapytaniu Gmail. Zamiast tego:
1. Wygeneruj zapytanie BEZ "from:" (tylko daty, filtry itp.)
2. Jeśli użytkownik wspomniał nadawcę, zwróć informację o tym w polu "hasSender" i "senderHint"

Operatory Gmail (BEZ from:):
- after:YYYY/MM/DD - po dacie
- before:YYYY/MM/DD - przed datą
- subject:tekst - w temacie
- body:tekst - w treści
- is:unread - nieprzeczytane
- has:attachment - z załącznikami
- in:inbox - w skrzynce odbiorczej

Zasady:
1. ZAWSZE dodawaj "in:inbox" na początku zapytania
2. NIE używaj "from:" - nadawcę rozpoznamy później na podstawie listy maili
3. Jeśli użytkownik wspomniał nadawcę (np. "od Roberta", "od oliwiera", "od Jana", "od Oliwier Markiewicz"), ustaw "hasSender": true i "senderHint" na imię/nazwisko
4. Dla dat używaj formatu YYYY/MM/DD
5. Unikaj złożonych zapytań z OR/AND jeśli nie jest to konieczne

Przykłady:
- "jaki mail przyszedł w zeszły poniedziałek" → query: "in:inbox after:2025/12/02 before:2025/12/09", hasSender: false
- "maile od Roberta w zeszły poniedziałek" → query: "in:inbox after:2025/12/02 before:2025/12/09", hasSender: true, senderHint: "robert"
- "czy jest mail od oliwiera w zeszły poniedziałek" → query: "in:inbox after:2025/12/02 before:2025/12/09", hasSender: true, senderHint: "oliwier"
- "jaki mail od Oliwier" → query: "in:inbox", hasSender: true, senderHint: "oliwier"
- "maile od Oliwier Markiewicz" → query: "in:inbox", hasSender: true, senderHint: "oliwier markiewicz"
- "ostatni mail" → query: "in:inbox", hasSender: false

Odpowiedz w formacie JSON:
{
  "query": "zapytanie Gmail BEZ from:",
  "hasSender": true/false,
  "senderHint": "imię/nazwisko nadawcy lub null"
}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      console.log(`[AI] Gmail query generation: empty response for transcript: "${transcript}"`);
      return { query: null, hasSender: false };
    }

    const result = JSON.parse(responseText);
    const query = result.query || null;
    const hasSender = Boolean(result.hasSender);
    const senderHint = result.senderHint || undefined;
    
    console.log(`[AI] Gmail query generation: transcript="${transcript}" → query="${query}" | hasSender: ${hasSender} | senderHint: "${senderHint}"`);
    
    return {
      query,
      queryWithoutSender: query,
      hasSender,
      senderHint,
    };
  } catch (error) {
    console.error('[AI] Failed to generate Gmail query:', error);
    return { query: null, hasSender: false };
  }
}

async function filterMessagesBySender(
  messages: GmailMessage[],
  senderHint: string,
  originalTranscript: string,
): Promise<GmailMessage[]> {
  if (messages.length === 0 || !senderHint) {
    return messages;
  }

  try { 
    const uniqueSenders = Array.from(new Set(messages.map(m => m.from)));
    
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'Jesteś ekspertem w rozpoznawaniu nadawców emaili. Odpowiadaj TYLKO czystym JSON bez markdown.',
        },
        {
          role: 'user',
          content: `Użytkownik zapytał: "${originalTranscript}"
Użytkownik wspomniał nadawcę: "${senderHint}"

Lista nadawców z maili:
${uniqueSenders.map((sender, idx) => `${idx + 1}. ${sender}`).join('\n')}

Które z tych nadawców pasują do "${senderHint}"? 
- Rozpoznaj na podstawie imienia, nazwiska lub części adresu email
- Zwróć numery (indeksy) pasujących nadawców (1-based)

Przykłady:
- senderHint: "oliwier" → pasuje do "Oliwier Markiewicz <oliwier@example.com>"
- senderHint: "robert" → pasuje do "Robert Kowalski" lub "robert.smith@example.com"
- senderHint: "jan" → pasuje do "Jan Nowak" lub "jan@example.com"

Odpowiedz w formacie JSON:
{
  "matchingIndices": [1, 3, 5] // numery (1-based) pasujących nadawców z listy
}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      console.log(`[AI] Sender filtering: empty response, returning all messages`);
      return messages;
    }

    const result = JSON.parse(responseText);
    const matchingIndices = result.matchingIndices || [];
    
    if (matchingIndices.length === 0) {
      console.log(`[AI] Sender filtering: no matches found for "${senderHint}"`);
      return [];
    }

    const matchingSenders = matchingIndices
      .map((idx: number) => uniqueSenders[idx - 1])
      .filter(Boolean);
    
    const filtered = messages.filter(m => matchingSenders.includes(m.from));
    
    console.log(`[AI] Sender filtering: "${senderHint}" → matched ${matchingSenders.length} senders, ${filtered.length} messages`);
    return filtered;
  } catch (error) {
    console.error('[AI] Failed to filter messages by sender:', error);
    return messages;
  }
}

async function detectEmailIntent(transcript: string): Promise<EmailIntent | undefined> {
  try {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content:
            'Jesteś ekspertem w rozpoznawaniu intencji związanych z emailami. Odpowiadaj TYLKO czystym JSON bez markdown.',
        },
        {
          role: 'user',
          content: `Użytkownik powiedział: "${transcript}"

Określ intencję użytkownika:
1. Jeśli użytkownik chce WYSŁAĆ email - ustaw "shouldSendEmail": true i wyodrębnij:
   - Adres email odbiorcy (to) - jeśli podany wprost
   - Imię/nazwisko odbiorcy (to) - jeśli podane
   - Temat (subject) - jeśli podany
   - Treść (body) - jeśli podana

2. Jeśli użytkownik chce CZYTAĆ/SPRAWDZAĆ emaile (np. "jakie maile przyszły", "był tam mail od X", "pokaż mi maile") - ustaw "shouldSendEmail": false, ale zwróć intencję z pustymi polami, aby system wiedział, że to zapytanie o emaile.

Odpowiedz w formacie JSON:
{
  "shouldSendEmail": true/false,
  "to": "adres email lub imię odbiorcy lub null",
  "subject": "temat lub null",
  "body": "treść lub null"
}

WAŻNE: Jeśli użytkownik pyta o czytanie/sprawdzanie emaili, zwróć obiekt z "shouldSendEmail": false, ale z pozostałymi polami (mogą być null).`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) return undefined;

    const intent = JSON.parse(responseText);
    
    if (intent.shouldSendEmail === true) {
      return intent;
    } else if (intent.shouldSendEmail === false) {
      return {
        shouldSendEmail: false,
        to: intent.to || undefined,
        subject: intent.subject || undefined,
        body: intent.body || undefined,
      };
    }
    
    return undefined;
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

