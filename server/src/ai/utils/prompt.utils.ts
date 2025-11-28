export class PromptUtils {
  static readonly DEFAULT_SYSTEM_PROMPT =
    'Jesteś ZUZA, pomocnym, ciepłym asystentem głosowym AI mówiącym po polsku. Odpowiadaj zwięźle i naturalnie.';

  static readonly TITLE_GENERATION_SYSTEM_PROMPT =
    'Jesteś asystentem, który tworzy krótkie, zwięzłe tytuły dla wiadomości. Odpowiadaj tylko tytułem, bez dodatkowych słów.';

  static generateTitlePrompt(firstMessage: string): string {
    return `Stwórz krótki, zwięzły tytuł (maksymalnie 5-6 słów) dla następującej wiadomości użytkownika. Tytuł powinien być po polsku i opisywać główny temat wiadomości. Odpowiedz tylko tytułem, bez dodatkowych słów.\n\nWiadomość: "${firstMessage}"`;
  }

  static buildMessages(
    systemPrompt: string,
    chatHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    userMessage: string,
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    return [
      { role: 'system', content: systemPrompt },
      ...chatHistory.filter((msg) => msg.role !== 'system'),
      { role: 'user', content: userMessage },
    ];
  }
}

