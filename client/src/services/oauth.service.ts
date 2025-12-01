import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://urmate-ai-zuza.onrender.com';

export const useGoogleAuth = () => {
  const handleGoogleLogin = async (): Promise<{
    type: 'success' | 'cancel' | 'error';
    token?: string;
    user?: unknown;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      // Nasłuchuj na deep link przed otwarciem przeglądarki
      const subscription = Linking.addEventListener('url', (event) => {
        const { path, queryParams } = Linking.parse(event.url);
        
        if (path === 'auth/google/callback') {
          subscription.remove();
          WebBrowser.dismissBrowser();
          
          const token = queryParams?.token as string;
          const userJson = queryParams?.user as string;
          const error = queryParams?.error as string;
          
          if (error) {
            resolve({ type: 'error', error });
            return;
          }
          
          if (token && userJson) {
            try {
              const user = JSON.parse(decodeURIComponent(userJson));
              resolve({ type: 'success', token, user });
            } catch (err) {
              resolve({ type: 'error', error: 'Failed to parse user data' });
            }
          } else {
            resolve({ type: 'error', error: 'Missing token or user data' });
          }
        }
      });

      // Otwórz przeglądarkę
      WebBrowser.openBrowserAsync(`${API_URL}/api/v1/auth/google`)
        .then((result) => {
          // Jeśli przeglądarka została zamknięta bez deep linka
          if (result.type === 'cancel' || result.type === 'dismiss') {
            subscription.remove();
            resolve({ type: 'cancel' });
          }
        })
        .catch((error) => {
          subscription.remove();
          resolve({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        });
    });
  };

  return { handleGoogleLogin };
};

