import { PromptUtils } from './prompt.utils';

describe('PromptUtils', () => {
  describe('DEFAULT_SYSTEM_PROMPT', () => {
    it('powinien zawierać domyślny prompt systemowy', () => {
      expect(PromptUtils.DEFAULT_SYSTEM_PROMPT).toContain('ZUZA');
      expect(PromptUtils.DEFAULT_SYSTEM_PROMPT).toContain('polsku');
    });
  });

  describe('TITLE_GENERATION_SYSTEM_PROMPT', () => {
    it('powinien zawierać prompt do generowania tytułów', () => {
      expect(PromptUtils.TITLE_GENERATION_SYSTEM_PROMPT).toContain('tytuły');
    });
  });

  describe('generateTitlePrompt', () => {
    it('powinien wygenerować prompt dla tytułu chatu', () => {
      const firstMessage = 'Jakie jest najlepsze miejsce na wakacje?';
      const result = PromptUtils.generateTitlePrompt(firstMessage);

      expect(result).toContain(firstMessage);
      expect(result).toContain('tytuł');
      expect(result).toContain('polsku');
    });

    it('powinien zawierać instrukcje dotyczące długości tytułu', () => {
      const result = PromptUtils.generateTitlePrompt('test');

      expect(result).toContain('5-6 słów');
      expect(result).toContain('maksymalnie');
    });
  });

  describe('buildMessages', () => {
    it('powinien zbudować tablicę wiadomości z promptem systemowym', () => {
      const systemPrompt = 'Jesteś pomocnym asystentem';
      const chatHistory = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi!' },
      ];
      const userMessage = 'How are you?';

      const result = PromptUtils.buildMessages(systemPrompt, chatHistory, userMessage);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ role: 'system', content: systemPrompt });
      expect(result[1]).toEqual({ role: 'user', content: 'Hello' });
      expect(result[2]).toEqual({ role: 'assistant', content: 'Hi!' });
      expect(result[3]).toEqual({ role: 'user', content: userMessage });
    });

    it('powinien usunąć systemowe wiadomości z historii', () => {
      const systemPrompt = 'System prompt';
      const chatHistory = [
        { role: 'system' as const, content: 'Old system' },
        { role: 'user' as const, content: 'Hello' },
      ];
      const userMessage = 'Test';

      const result = PromptUtils.buildMessages(systemPrompt, chatHistory, userMessage);

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('system');
      expect(result[0].content).toBe(systemPrompt);
      expect(result.find((msg) => msg.content === 'Old system')).toBeUndefined();
    });

    it('powinien obsłużyć pustą historię', () => {
      const systemPrompt = 'System prompt';
      const userMessage = 'Test';

      const result = PromptUtils.buildMessages(systemPrompt, [], userMessage);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: 'system', content: systemPrompt });
      expect(result[1]).toEqual({ role: 'user', content: userMessage });
    });
  });
});

