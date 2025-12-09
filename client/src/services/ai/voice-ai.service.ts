import { openAIClient } from './openai-client';
import type { VoiceProcessResult, EmailIntent, CalendarIntent, SmsIntent } from '../../shared/types/ai.types';
import { getChats, getChatById } from '../chats.service';
import { getGmailMessages, getGmailStatus } from '../gmail.service';
import { getEvents, getCalendarStatus } from '../calendar.service';
import { GmailFormatter } from '../../shared/utils/gmail-formatter.utils';
import { CalendarFormatter } from '../../shared/utils/calendar-formatter.utils';

type VoiceProcessOptions = {
  language?: string;
  context?: string;
  location?: string;
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

const buildSystemPrompt = (userName?: string, context?: string, location?: string): string => {
  const nameInstruction = userName
    ? ` Zwracaj się do użytkownika po imieniu "${userName}" gdy to możliwe i naturalne.`
    : '';

  let basePrompt =
    'Jesteś ZUZA, pomocnym, ciepłym asystentem głosowym AI mówiącym po polsku. Odpowiadaj bardzo krótko, konkretnie i na temat – maksymalnie 1–2 zdania. Nie używaj odnośników, URL-i ani formatowania markdown, nie dodawaj wyjaśnień ani długich opisów.' +
    nameInstruction +
    ' WAŻNE: Gdy otrzymasz aktualne informacje z internetu w kontekście, użyj ich do odpowiedzi. Jeśli znasz lokalizację użytkownika, uwzględnij ją w odpowiedzi.';

  if (context) {
    basePrompt = `${basePrompt}\n\nKontekst:\n${context}`;
  }

  if (location) {
    basePrompt = `${basePrompt}\n\nAktualna (przybliżona) lokalizacja użytkownika: ${location}.`;
  }

  return basePrompt;
};

async function classifyIntent(transcript: string): Promise<IntentClassification> {
  try {
    const completion = await openAIClient.chatCompletions({
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
          content: `Sklasyfikuj następujące zapytanie użytkownika:\n\n"${transcript}"\n\nZwróć JSON z klasyfikacją intencji.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      return fallbackClassification(transcript);
    }

    const classification = JSON.parse(responseText) as IntentClassification;
    return classification;
  } catch (error) {
    console.error('[AI] Failed to classify intent:', error);
    return fallbackClassification(transcript);
  }
}

function fallbackClassification(transcript: string): IntentClassification {
  const lower = transcript.toLowerCase();
  const needsPlacesSearch =
    lower.includes('ile metrów') ||
    lower.includes('jak daleko') ||
    lower.includes('najbliższ') ||
    lower.includes('gdzie jest') ||
    lower.includes('restauracj') ||
    lower.includes('sklep') ||
    lower.includes('apteka');

  const needsWebSearch =
    (lower.includes('pogoda') ||
      lower.includes('temperatura') ||
      lower.includes('wynik') ||
      lower.includes('kurs')) &&
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

export async function transcribeAndRespond(
  audioUri: string,
  userId: string,
  options: VoiceProcessOptions = {},
): Promise<VoiceProcessResult> {
  const transcript = await openAIClient.transcribeAudio(
    audioUri,
    options.language,
  );

  const intentClass = await classifyIntent(transcript);

  const chatHistory = await getChats();
  const recentChat = chatHistory[0];
  const messages = recentChat
    ? await getChatById(recentChat.id)
        .then((chat) => chat.messages || [])
        .catch(() => [])
    : [];

  let context = options.context;
  let isGmailConnected = false;
  let isCalendarConnected = false;

  if (intentClass.needsEmailIntent || intentClass.needsCalendarIntent) {
    if (intentClass.needsEmailIntent) {
      try {
        const gmailStatus = await getGmailStatus().catch(() => ({ isConnected: false }));
        if (gmailStatus.isConnected) {
          const messages = await getGmailMessages(20).catch(() => []);
          if (messages.length > 0) {
            const gmailContext = GmailFormatter.formatForAiContext(messages);
            context = `${context || ''}\n\n${gmailContext}`;
            isGmailConnected = true;
          }
        }
      } catch (e) {
        console.warn('[AI] Failed to get Gmail context:', e);
      }
    }

    if (intentClass.needsCalendarIntent) {
      try {
        const calendarStatus = await getCalendarStatus().catch(() => ({ isConnected: false }));
        if (calendarStatus.isConnected) {
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
          
          if (events.length > 0) {
            const calendarContext = CalendarFormatter.formatForAiContext(events, 7);
            context = `${context || ''}\n\n${calendarContext}`;
            isCalendarConnected = true;
          }
        }
      } catch (e) {
        console.warn('[AI] Failed to get Calendar context:', e);
      }
    }
  }

  const systemPrompt = buildSystemPrompt(undefined, context, options.location);
  const chatMessages = messages
    .slice(-20)
    .map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

  const allMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...chatMessages,
    { role: 'user' as const, content: transcript },
  ];

  let reply: string;
  if (intentClass.isSimpleGreeting && intentClass.confidence === 'high') {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4o-mini',
      messages: allMessages,
      max_tokens: 300,
      temperature: 0.7,
    });
    reply = completion.choices[0]?.message?.content?.trim() || 'Cześć!';
  } else if (intentClass.needsWebSearch) {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4o-mini',
      messages: allMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
    reply = completion.choices[0]?.message?.content?.trim() || 'Przepraszam, nie zrozumiałam.';
  } else {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4o-mini',
      messages: allMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
    reply = completion.choices[0]?.message?.content?.trim() || 'Przepraszam, nie zrozumiałam.';
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

  const result: VoiceProcessResult = {
    transcript,
    reply: smsIntent?.shouldSendSms
      ? 'Otwieram dla Ciebie aplikację SMS. Wybierz odbiorcę (jeśli trzeba), uzupełnij treść i wyślij wiadomość samodzielnie.'
      : reply,
  };

  if (emailIntent) result.emailIntent = emailIntent;
  if (calendarIntent) result.calendarIntent = calendarIntent;
  if (smsIntent) result.smsIntent = smsIntent;

  return result;
}

async function detectEmailIntent(transcript: string): Promise<EmailIntent | undefined> {
  try {
    const completion = await openAIClient.chatCompletions({
      model: 'gpt-4o',
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
      model: 'gpt-4o',
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
      model: 'gpt-4o',
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

