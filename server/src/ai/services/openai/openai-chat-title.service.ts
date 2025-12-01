import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PromptUtils } from '../../utils/prompt.utils';

@Injectable()
export class OpenAIChatTitleService {
  private readonly logger = new Logger(OpenAIChatTitleService.name);
  private readonly openai: OpenAI;
  private readonly maxTitleLength = 60;
  private readonly defaultTitle = 'Nowa rozmowa';

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set – chat title generation will not work.',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generate(firstMessage: string): Promise<string> {
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

      const rawTitle = completion.choices[0]?.message?.content?.trim();
      const title =
        rawTitle && rawTitle.length > 0 ? rawTitle : this.defaultTitle;

      return this.truncateTitle(title);
    } catch (error) {
      this.logger.error('Error generating chat title:', error);
      return this.defaultTitle;
    }
  }

  private truncateTitle(title: string): string {
    return title.length > this.maxTitleLength
      ? title.substring(0, this.maxTitleLength)
      : title;
  }
}
