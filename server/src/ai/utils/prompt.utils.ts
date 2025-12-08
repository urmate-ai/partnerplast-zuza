export class PromptUtils {
  static buildSystemPrompt(userName?: string): string {
    const nameInstruction = userName
      ? ` Zwracaj się do użytkownika po imieniu "${userName}" gdy to możliwe i naturalne.`
      : '';

    return (
      'Jesteś ZUZA, pomocnym, ciepłym asystentem głosowym AI mówiącym po polsku. Odpowiadaj bardzo krótko, konkretnie i na temat – maksymalnie 1–2 zdania. Nie używaj odnośników, URL-i ani formatowania markdown, nie dodawaj wyjaśnień ani długich opisów.' +
      nameInstruction +
      ' WAŻNE: Gdy otrzymasz aktualne informacje z internetu w kontekście, użyj ich do odpowiedzi. Jeśli znasz lokalizację użytkownika, uwzględnij ją w odpowiedzi.'
    );
  }

  static readonly DEFAULT_SYSTEM_PROMPT = PromptUtils.buildSystemPrompt();

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
