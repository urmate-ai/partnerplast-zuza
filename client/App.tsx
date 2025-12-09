import "./global.css"
import "./src/shared/utils/nativewind-setup"
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { requestLocationPermission } from './src/shared/utils/location.utils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export default function App() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('[App] 🚀 Aplikacja uruchomiona, proszę o uprawnienia do lokalizacji...');
      requestLocationPermission()
        .then((granted) => {
          if (granted) {
            console.log('[App] ✅ Uprawnienia do lokalizacji przyznane');
          } else {
            console.log('[App] ❌ Uprawnienia do lokalizacji odrzucone');
          }
        })
        .catch((error) => {
          console.error('[App] ❌ Błąd przy prośbie o uprawnienia:', error);
        });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}
