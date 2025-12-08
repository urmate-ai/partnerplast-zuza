# Podsumowanie zmian - Naprawa Deep Linking dla iOS Safari

## Problem
Po udanym zalogowaniu OAuth lub połączeniu integracji (Gmail/Calendar), Safari na iOS nie mógł otworzyć linku powrotnego do aplikacji, pokazując błąd "Safari cannot open the page because the address is invalid".

## Wprowadzone zmiany

### 1. Konfiguracja aplikacji (`client/app.json`)

**Przed:**
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.urmate.ai.zuza",
  "infoPlist": {
    "CFBundleURLTypes": [
      {
        "CFBundleURLSchemes": ["urmate-ai-zuza"]
      }
    ],
    ...
  }
}
```

**Po:**
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.urmate.ai.zuza",
  "infoPlist": {
    "CFBundleURLTypes": [
      {
        "CFBundleURLSchemes": ["urmate-ai-zuza"],
        "CFBundleURLName": "com.urmate.ai.zuza"
      }
    ],
    "LSApplicationQueriesSchemes": ["urmate-ai-zuza"],
    ...
  }
}
```

**Dlaczego:**
- `CFBundleURLName` - poprawia identyfikację URL scheme w iOS
- `LSApplicationQueriesSchemes` - pozwala aplikacji sprawdzić, czy może obsłużyć dany URL scheme

### 2. Hooki integracji

#### `client/src/components/integrations/hooks/useCalendarIntegration.ts`
#### `client/src/components/integrations/hooks/useGmailIntegration.ts`

**Przed:**
```typescript
const redirectUrl = 'urmate-ai-zuza://integrations';

const result = await WebBrowser.openAuthSessionAsync(
  authUrl,
  redirectUrl,
);
```

**Po:**
```typescript
const redirectUrl = Linking.createURL('integrations');
console.log('Calendar redirect URL:', redirectUrl);

const result = await WebBrowser.openAuthSessionAsync(
  authUrl,
  redirectUrl,
  {
    preferEphemeralSession: false,
  }
);

console.log('Calendar auth result:', result);
```

**Dlaczego:**
- `Linking.createURL()` - automatycznie generuje prawidłowy URL dla danej platformy (Expo Go vs standalone)
- `preferEphemeralSession: false` - wymusza użycie ASWebAuthenticationSession w iOS, co lepiej obsługuje deep linking
- Dodane logi - ułatwiają debugowanie

### 3. Shared hooki integracji

#### `client/src/shared/hooks/integrations/useCalendarIntegration.hook.ts`
#### `client/src/shared/hooks/integrations/useGmailIntegration.hook.ts`

Analogiczne zmiany jak w hookach komponentów.

### 4. Serwis OAuth (`client/src/services/oauth.service.ts`)

**Przed:**
```typescript
WebBrowser.openBrowserAsync(`${API_URL}/api/v1/auth/google`)
```

**Po:**
```typescript
const redirectUrl = Linking.createURL('auth/google/callback');
const authUrl = `${API_URL}/api/v1/auth/google?state=${encodeURIComponent(redirectUrl)}`;

console.log('[OAuth] Opening browser with redirect URL:', redirectUrl);
console.log('[OAuth] Auth URL:', authUrl);

WebBrowser.openBrowserAsync(authUrl)
```

**Dlaczego:**
- Przekazuje `redirectUrl` jako parametr `state` do backendu
- Backend może użyć tego URL do przekierowania
- Dodane logi dla debugowania

### 5. Kontrolery backendu

#### `server/src/integrations/controllers/gmail.controller.ts`
#### `server/src/integrations/controllers/calendar.controller.ts`
#### `server/src/auth/auth.controller.ts`

**Przed:**
```javascript
<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      const button = document.getElementById('returnButton');
      if (button) {
        button.click();
      }
    }, 500);
  });
</script>
```

**Po:**
```javascript
<script>
  (function() {
    const deepLink = '${deepLink}';
    
    // Metoda 1: Natychmiastowe przekierowanie (najlepsze dla Safari)
    try {
      window.location.replace(deepLink);
    } catch (e) {
      console.error('location.replace failed:', e);
    }
    
    // Metoda 2: Fallback - automatyczne kliknięcie
    window.addEventListener('load', function() {
      setTimeout(function() {
        const button = document.getElementById('returnButton');
        if (button) {
          button.click();
        }
      }, 100);
    });
    
    // Metoda 3: Dodatkowy fallback przez location.href
    setTimeout(function() {
      try {
        window.location.href = deepLink;
      } catch (e) {
        console.error('location.href failed:', e);
      }
    }, 500);
  })();
</script>
```

**Dlaczego:**
- Safari ma restrykcyjne zasady dotyczące przekierowań
- Używamy trzech różnych metod jako fallback
- `window.location.replace()` - najlepsza metoda dla Safari
- Automatyczne kliknięcie - działa w większości przeglądarek
- `window.location.href` - ostatni fallback

### 6. Navigator (`client/src/navigation/RootNavigator.tsx`)

**Przed:**
```typescript
<NavigationContainer ref={navigationRef}>
```

**Po:**
```typescript
const linking = useMemo(() => ({
  prefixes: [
    Linking.createURL('/'),
    'urmate-ai-zuza://',
    'exp://192.168.1.100:8081', // Dla Expo Go
  ],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Home: 'home',
      Settings: 'settings',
      EditProfile: 'edit-profile',
      ChangePassword: 'change-password',
      Integrations: 'integrations',
      SearchChats: 'search-chats',
      ChatDetail: 'chat/:chatId',
    },
  },
}), []);

<NavigationContainer 
  ref={navigationRef}
  linking={linking}
  onReady={() => {
    console.log('[Navigation] NavigationContainer ready');
  }}
  onStateChange={(state) => {
    console.log('[Navigation] State changed:', state);
  }}
>
```

**Dlaczego:**
- Pełna konfiguracja linking - React Navigation automatycznie obsługuje deep linki
- Prefiksy - obsługuje różne formaty URL (custom scheme, Expo Go)
- Mapowanie ścieżek - każdy ekran ma swoją ścieżkę
- Logi - ułatwiają debugowanie nawigacji

## Testowanie

### 1. Restart aplikacji
```bash
cd client
npm start
```

### 2. Sprawdź logi
Po uruchomieniu aplikacji, w konsoli powinny pojawić się:
```
[Navigation] NavigationContainer ready
```

### 3. Testuj integracje
1. Otwórz aplikację na telefonie
2. Przejdź do Settings → Integrations
3. Kliknij "Connect" przy Gmail lub Calendar
4. Zaloguj się przez Google
5. Sprawdź logi:
```
Calendar redirect URL: urmate-ai-zuza://integrations
Calendar auth result: { type: 'success', url: '...' }
[Navigation] State changed: ...
```

### 4. Testuj logowanie Google
1. Na ekranie logowania kliknij "Continue with Google"
2. Zaloguj się przez Google
3. Sprawdź logi:
```
[OAuth] Opening browser with redirect URL: urmate-ai-zuza://auth/google/callback
[OAuth] Deep link received: urmate-ai-zuza://auth/google/callback?code=...
[OAuth] Token exchange successful
```

## Pliki zmienione

### Klient (React Native/Expo)
- `client/app.json` - konfiguracja iOS URL scheme
- `client/src/components/integrations/hooks/useCalendarIntegration.ts` - hook integracji Calendar
- `client/src/components/integrations/hooks/useGmailIntegration.ts` - hook integracji Gmail
- `client/src/shared/hooks/integrations/useCalendarIntegration.hook.ts` - shared hook Calendar
- `client/src/shared/hooks/integrations/useGmailIntegration.hook.ts` - shared hook Gmail
- `client/src/services/oauth.service.ts` - serwis OAuth
- `client/src/navigation/RootNavigator.tsx` - konfiguracja nawigacji i deep linking

### Serwer (NestJS)
- `server/src/integrations/controllers/gmail.controller.ts` - kontroler Gmail callback
- `server/src/integrations/controllers/calendar.controller.ts` - kontroler Calendar callback
- `server/src/auth/auth.controller.ts` - kontroler Google OAuth callback

### Dokumentacja
- `client/DEEP_LINKING_FIX.md` - szczegółowa dokumentacja naprawy
- `DEEP_LINKING_CHANGES.md` - ten plik

## Następne kroki

### Dla developmentu
1. Restart aplikacji: `npm start` w folderze `client`
2. Testuj na fizycznym urządzeniu iOS
3. Sprawdź logi w konsoli

### Dla produkcji
1. Rozważ użycie Universal Links zamiast custom URL scheme
2. Skonfiguruj Apple App Site Association (AASA) file
3. Dodaj Associated Domains w Xcode
4. Zaktualizuj backend, aby serwował AASA file

## Dodatkowe zasoby

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [iOS URL Schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)
- [Universal Links](https://developer.apple.com/ios/universal-links/)
- [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)
