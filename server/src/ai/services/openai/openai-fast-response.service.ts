import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PromptUtils } from '../../utils/prompt.utils';
import type { MessageRole } from '../../types/chat.types';

type ChatHistoryMessage = {
  role: MessageRole;
  content: string;
};

@Injectable()
export class OpenAIFastResponseService {
  private readonly logger = new Logger(OpenAIFastResponseService.name);
  private readonly openai: OpenAI;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – fast response features will not work.',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateFast(
    transcript: string,
    chatHistory: ChatHistoryMessage[] = [],
    context?: string,
    location?: string,
    userName?: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, location, userName);
    const messages = PromptUtils.buildMessages(
      systemPrompt,
      chatHistory,
      transcript,
    );

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1 nano',
        messages: messages as Array<{
          role: 'system' | 'user' | 'assistant';
          content: string;
        }>,
        max_tokens: 300,
        temperature: 0.7,
        stream: false,
      });

      const reply = completion.choices[0]?.message?.content?.trim();

      if (!reply) {
        this.logger.warn('Empty response from GPT-4o-mini');
        return 'Przepraszam, nie zrozumiałam. Możesz powtórzyć?';
      }

      return reply;
    } catch (error) {
      this.logger.error('Failed to generate fast response:', error);
      throw error;
    }
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
}
