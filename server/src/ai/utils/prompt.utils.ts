export class PromptUtils {
  static readonly DEFAULT_SYSTEM_PROMPT =
    'Jesteś ZUZA, pomocnym, ciepłym asystentem głosowym AI mówiącym po polsku. Odpowiadaj bardzo krótko, konkretnie i na temat – maksymalnie 1–2 zdania. Nie używaj odnośników, URL-i ani formatowania markdown, nie dodawaj wyjaśnień ani długich opisów. Masz dostęp do narzędzia web_search, ale używaj go TYLKO wtedy, gdy pytanie wymaga aktualnych lub bardzo specyficznych danych (np. bieżąca pogoda, aktualne wydarzenia, wyniki na żywo, najnowsze statystyki, świeże wiadomości). W pozostałych przypadkach odpowiadaj z własnej wiedzy i nie wywołuj web_search.';

  static readonly TITLE_GENERATION_SYSTEM_PROMPT =
    'Jesteś asystentem, który tworzy krótkie, zwięzłe tytuły dla wiadomości. Odpowiadaj tylko tytułem, bez dodatkowych słów.';

  static generateTitlePrompt(firstMessage: string): string {
    return `Stwórz krótki, zwięzły tytuł (maksymalnie 5-6 słów) dla następującej wiadomości użytkownika. Tytuł powinien być po polsku i opisywać główny temat wiadomości. Odpowiedz tylko tytułem, bez dodatkowych słów.\n\nWiadomość: "${firstMessage}"`;
  }

  static buildMessages(
    systemPrompt: string,
    chatHistory: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }>,
    userMessage: string,
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    return [
      { role: 'system', content: systemPrompt },
      ...chatHistory.filter((msg) => msg.role !== 'system'),
      { role: 'user', content: userMessage },
    ];
  }
}
