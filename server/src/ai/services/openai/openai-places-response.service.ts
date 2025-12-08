import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PromptUtils } from '../../utils/prompt.utils';
import { GooglePlacesService } from '../places/google-places.service';
import type { MessageRole } from '../../types/chat.types';

type ChatHistoryMessage = {
  role: MessageRole;
  content: string;
};

@Injectable()
export class OpenAIPlacesResponseService {
  private readonly logger = new Logger(OpenAIPlacesResponseService.name);
  private readonly openai: OpenAI;

  constructor(
    apiKey: string | undefined,
    private readonly placesService: GooglePlacesService,
  ) {
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY is not set');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateWithPlaces(
    transcript: string,
    chatHistory: ChatHistoryMessage[] = [],
    context?: string,
    location?: string,
    userLatitude?: number,
    userLongitude?: number,
    userName?: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context, location, userName);
    const messages = PromptUtils.buildMessages(
      systemPrompt,
      chatHistory,
      transcript,
    );

    try {
      this.logger.debug(
        `Calling GPT-4o with nearbyPlaces function for location-based query`,
      );

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: 500,
        temperature: 0.7,
        tools: [
          {
            type: 'function',
            function: {
              name: 'nearbyPlaces',
              description:
                'Wyszukuje miejsca w okolicy użytkownika (restauracje, bary, stacje benzynowe, atrakcje itp.) na podstawie lokalizacji GPS.',
              parameters: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description:
                      'Zapytanie wyszukiwania, np. "schabowy", "stacja benzynowa", "bar", "restauracja włoska"',
                  },
                  type: {
                    type: 'string',
                    description:
                      'Typ miejsca (opcjonalnie): restaurant, bar, gas_station, tourist_attraction, cafe, etc.',
                  },
                  radius: {
                    type: 'number',
                    description:
                      'Promień wyszukiwania w metrach (domyślnie 5000)',
                  },
                },
                required: ['query'],
              },
            },
          },
        ],
        tool_choice: 'auto',
      });

      const message = completion.choices[0]?.message;

      if (!message) {
        return 'Przepraszam, nie udało się wygenerować odpowiedzi.';
      }

      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];

        if (toolCall.function.name === 'nearbyPlaces') {
          const args = JSON.parse(toolCall.function.arguments) as {
            query: string;
            type?: string;
            radius?: number;
          };

          this.logger.debug(
            `Calling nearbyPlaces with args: ${JSON.stringify(args)}`,
          );

          this.logger.debug(
            `Checking location: lat=${userLatitude}, lng=${userLongitude}`,
          );
          if (userLatitude && userLongitude) {
            this.logger.debug(
              `Calling Google Places API with coordinates: (${userLatitude}, ${userLongitude})`,
            );
            const places = await this.placesService.searchNearby({
              latitude: userLatitude,
              longitude: userLongitude,
              query: args.query,
              type: args.type,
              radius: args.radius || 5000,
              maxResults: 5,
            });

            const placesInfo = this.placesService.formatPlacesForAI(places);

            const secondCompletion = await this.openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                ...messages.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })),
                {
                  role: 'assistant',
                  content: message.content || null,
                  tool_calls: message.tool_calls,
                },
                {
                  role: 'tool',
                  content: placesInfo,
                  tool_call_id: toolCall.id,
                },
              ],
              max_tokens: 500,
              temperature: 0.7,
            });

            const finalReply =
              secondCompletion.choices[0]?.message?.content?.trim();

            if (!finalReply) {
              return 'Przepraszam, nie udało się wygenerować odpowiedzi.';
            }

            return finalReply;
          } else {
            this.logger.warn(
              `Missing location coordinates: lat=${userLatitude}, lng=${userLongitude}`,
            );
            return 'Przepraszam, nie mam dostępu do Twojej dokładnej pozycji. Podaj proszę adres lub włącz udostępnianie lokalizacji, a podam odległość w metrach.';
          }
        }
      }

      const reply = message.content?.trim();

      if (!reply) {
        return 'Przepraszam, nie zrozumiałam. Możesz powtórzyć?';
      }

      return reply;
    } catch (error) {
      this.logger.error('Failed to generate response with places:', error);
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
