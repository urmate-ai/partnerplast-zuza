import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
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
  private readonly openai: OpenAI;

  constructor(
    responsesClient: OpenAIResponsesClient,
    config: OpenAIConfig,
    cacheService: ResponseCacheService,
    openai: OpenAI,
  ) {
    this.responsesClient = responsesClient;
    this.config = config;
    this.cacheService = cacheService;
    this.openai = openai;
  }

  async generate(
    transcript: string,
    chatHistory: ChatHistoryMessage[] = [],
    context?: string,
    location?: string,
    useWebSearch: boolean = false,
    userName?: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, location, userName);
    const messages = PromptUtils.buildMessages(
      systemPrompt,
      chatHistory,
      transcript,
    );

    const cacheKey = this.buildCacheKey(
      systemPrompt,
      chatHistory,
      transcript,
      useWebSearch,
    );
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.callOpenAI(messages, useWebSearch);
    const finalReply = this.processResponse(response);

    this.cacheService.set(cacheKey, finalReply);
    return finalReply;
  }

  private buildSystemPrompt(
    context?: string,
    location?: string,
    userName?: string,
  ): string {
    const basePrompt = context ?? PromptUtils.buildSystemPrompt(userName);
    if (!location) {
      return basePrompt;
    }
    return `${basePrompt} Aktualna (przybliżona) lokalizacja użytkownika: ${location}.`;
  }

  private buildCacheKey(
    systemPrompt: string,
    chatHistory: ChatHistoryMessage[],
    transcript: string,
    useWebSearch: boolean,
  ): string {
    return JSON.stringify({
      systemPrompt,
      chatHistory,
      transcript,
      useWebSearch,
    });
  }

  private async callOpenAI(
    messages: Array<{ role: string; content: string }>,
    useWebSearch: boolean = false,
  ): Promise<unknown> {
    if (useWebSearch) {
      this.logger.debug(
        `Using GPT-5 with web_search for query requiring internet search`,
      );

      const input = messages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');

      const requestBody: ResponsesCreateParams = {
        model: 'gpt-5',
        input,
        reasoning: { effort: 'low' },
        tools: [{ type: 'web_search' }],
      };

      if (
        typeof this.config.maxTokens === 'number' &&
        this.config.maxTokens > 0
      ) {
        requestBody.max_output_tokens = this.config.maxTokens;
      }

      return this.responsesClient.create(requestBody);
    }

    if (this.config.model === 'gpt-4o-mini' || this.config.model === 'gpt-4o') {
      this.logger.debug(`Calling ${this.config.model} for response generation`);

      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: messages as Array<{
          role: 'system' | 'user' | 'assistant';
          content: string;
        }>,
        max_tokens: this.config.maxTokens || 500,
        temperature: this.config.temperature || 0.7,
        stream: false,
      });

      return {
        choices: [
          {
            message: {
              content: completion.choices[0]?.message?.content || '',
            },
          },
        ],
      };
    }

    const input = messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const requestBody: ResponsesCreateParams = {
      model: this.config.model,
      input,
      reasoning: { effort: 'low' },
    };

    if (
      typeof this.config.maxTokens === 'number' &&
      this.config.maxTokens > 0
    ) {
      requestBody.max_output_tokens = this.config.maxTokens;
    }

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
