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

      const parsed = JSON.parse(responseText);
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
