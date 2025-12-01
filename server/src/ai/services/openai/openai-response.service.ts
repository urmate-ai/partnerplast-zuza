import { Injectable, Logger } from '@nestjs/common';
import { PromptUtils } from '../../utils/prompt.utils';
import {
  extractReplyFromResponse,
  postprocessReply,
} from '../../utils/openai.utils';
import { ResponseCacheService } from '../cache/response-cache.service';
import type {
  OpenAIConfig,
  OpenAIResponsePayload,
  OpenAIResponsesClient,
  ResponsesCreateParams,
} from '../../types/ai.types';
import type { MessageRole } from '../../types/chat.types';

type ChatHistoryMessage = {
  role: MessageRole;
  content: string;
};

@Injectable()
export class OpenAIResponseService {
  private readonly logger = new Logger(OpenAIResponseService.name);
  private readonly responsesClient: OpenAIResponsesClient;
  private readonly config: OpenAIConfig;
  private readonly cacheService: ResponseCacheService;

  constructor(
    responsesClient: OpenAIResponsesClient,
    config: OpenAIConfig,
    cacheService: ResponseCacheService,
  ) {
    this.responsesClient = responsesClient;
    this.config = config;
    this.cacheService = cacheService;
  }

  async generate(
    transcript: string,
    chatHistory: ChatHistoryMessage[] = [],
    context?: string,
    location?: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, location);
    const messages = PromptUtils.buildMessages(
      systemPrompt,
      chatHistory,
      transcript,
    );

    const cacheKey = this.buildCacheKey(systemPrompt, chatHistory, transcript);
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.callOpenAI(messages);
    const finalReply = this.processResponse(response);

    this.cacheService.set(cacheKey, finalReply);
    return finalReply;
  }

  private buildSystemPrompt(context?: string, location?: string): string {
    const basePrompt = context ?? PromptUtils.DEFAULT_SYSTEM_PROMPT;
    if (!location) {
      return basePrompt;
    }
    return `${basePrompt} Aktualna (przybliżona) lokalizacja użytkownika: ${location}.`;
  }

  private buildCacheKey(
    systemPrompt: string,
    chatHistory: ChatHistoryMessage[],
    transcript: string,
  ): string {
    return JSON.stringify({ systemPrompt, chatHistory, transcript });
  }

  private async callOpenAI(
    messages: Array<{ role: string; content: string }>,
  ): Promise<unknown> {
    const input = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const requestBody: ResponsesCreateParams = {
      model: this.config.model,
      input,
      reasoning: { effort: 'low' },
      tools: [{ type: 'web_search' }],
    };

    return this.responsesClient.create(requestBody);
  }

  private processResponse(response: unknown): string {
    let reply = extractReplyFromResponse(response as OpenAIResponsePayload);

    if (!reply || !reply.trim()) {
      this.logger.error(
        'Empty AI reply, raw response:',
        JSON.stringify(response),
      );
      reply =
        'Przepraszam, nie udało mi się wygenerować odpowiedzi na to pytanie.';
    }

    return postprocessReply(reply);
  }
}
