# Husky Git Hooks

Ten projekt używa [Husky](https://typicode.github.io/husky/) do zarządzania Git hooks.

## Konfiguracja

### Pre-commit Hook
Przed każdym commitem automatycznie:
- Uruchamia `lint-staged` w katalogu `server/`
- Formatuje i naprawia błędy ESLint w zmienionych plikach TypeScript
- Formatuje pliki JSON, Markdown, YAML

### Pre-push Hook
Przed każdym pushem automatycznie:
- Uruchamia testy jednostkowe w katalogu `server/`
- Blokuje push jeśli testy nie przejdą

### Post-merge Hook
Po każdym merge automatycznie:
- Aktualizuje zależności w `client/` i `server/`

## Jak to działa

1. **Pre-commit**: Gdy próbujesz zrobić commit, Husky uruchamia `lint-staged`, który:
   - Znajduje wszystkie staged pliki TypeScript
   - Uruchamia ESLint z automatyczną naprawą
   - Formatuje pliki używając Prettier
   - Dodaje sformatowane pliki z powrotem do staging area

2. **Pre-push**: Gdy próbujesz zrobić push, Husky uruchamia testy:
   - Jeśli testy nie przejdą, push zostanie zablokowany
   - Musisz naprawić błędy przed ponownym pushem

## Pomijanie hooków (niezalecane)

W wyjątkowych sytuacjach możesz pominąć hooki:

```bash
# Pomiń pre-commit hook
git commit --no-verify -m "message"

# Pomiń pre-push hook
git push --no-verify
```

⚠️ **Uwaga**: Używaj tego tylko w wyjątkowych sytuacjach!

## Konfiguracja lint-staged

Konfiguracja znajduje się w `server/package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

## Aktualizacja Husky

Jeśli potrzebujesz zaktualizować Husky:

```bash
npm install --save-dev husky@latest
npx husky install
```

