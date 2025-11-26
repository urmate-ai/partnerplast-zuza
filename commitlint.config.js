export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nowa funkcjonalność
        'fix',      // Naprawa błędu
        'docs',     // Zmiany w dokumentacji
        'style',    // Zmiany formatowania (nie wpływają na kod)
        'refactor', // Refaktoryzacja kodu
        'perf',     // Poprawa wydajności
        'test',     // Dodanie/zmiana testów
        'build',    // Zmiany w systemie budowania
        'ci',       // Zmiany w CI/CD
        'chore',    // Inne zmiany (np. aktualizacja zależności)
        'revert',   // Cofnięcie poprzedniego commita
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};

