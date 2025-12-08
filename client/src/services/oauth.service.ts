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
      let resolved = false;
      
      // Timeout po 5 minutach
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.error('[OAuth] Timeout waiting for callback');
          subscription.remove();
          resolved = true;
          resolve({ type: 'error', error: 'Timeout waiting for OAuth callback' });
        }
      }, 5 * 60 * 1000);
      
      const subscription = Linking.addEventListener('url', async (event) => {
        console.log('[OAuth] Deep link received:', event.url);
        const { path, queryParams } = Linking.parse(event.url);
        
        console.log('[OAuth] Parsed path:', path, 'queryParams:', queryParams);
        
        const isCallback = path === 'auth/google/callback' || 
                          path?.includes('auth/google/callback') ||
                          event.url.includes('auth/google/callback');
        
        if (isCallback) {
          console.log('[OAuth] Callback detected!');
          
          if (resolved) {
            console.log('[OAuth] Already resolved, ignoring callback');
            return;
          }
          
          resolved = true;
          clearTimeout(timeout);
          subscription.remove();
          WebBrowser.dismissBrowser();
          
          const code = queryParams?.code as string;
          const error = queryParams?.error as string;
          
          console.log('[OAuth] Callback params:', { code: !!code, error });
          
          if (error) {
            resolve({ type: 'error', error });
            return;
          }
          
          if (code) {
            try {
              console.log('[OAuth] Exchanging code for token...');
              const response = await fetch(`${API_URL}/api/v1/auth/google/exchange`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
              });

              if (!response.ok) {
                throw new Error('Failed to exchange code for token');
              }

              const data = await response.json();
              console.log('[OAuth] Token exchange successful');
              resolve({ type: 'success', token: data.accessToken, user: data.user });
            } catch (err) {
              console.error('[OAuth] Token exchange failed:', err);
              resolve({ type: 'error', error: 'Failed to exchange code for token' });
            }
          } else {
            resolve({ type: 'error', error: 'Missing code' });
          }
        }
      });

      const redirectUrl = Linking.createURL('auth/google/callback');
      const authUrl = `${API_URL}/api/v1/auth/google?state=${encodeURIComponent(redirectUrl)}`;
      
      console.log('[OAuth] Opening auth session with redirect URL:', redirectUrl);
      console.log('[OAuth] Auth URL:', authUrl);

      // Użyj openAuthSessionAsync zamiast openBrowserAsync dla lepszej obsługi deep linking w iOS
      WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
        preferEphemeralSession: false,
      })
        .then((result) => {
          console.log('[OAuth] Auth session result:', result);
          
          // openAuthSessionAsync zwraca 'success' gdy redirect się powiódł
          if (result.type === 'success' && result.url) {
            console.log('[OAuth] Success redirect received:', result.url);
            // URL jest już obsłużony przez listener powyżej
            // Nie musimy nic robić, listener obsłuży wymianę code na token
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            console.log('[OAuth] Auth session cancelled');
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              subscription.remove();
              resolve({ type: 'cancel' });
            }
          } else {
            console.log('[OAuth] Auth session failed:', result.type);
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              subscription.remove();
              resolve({ type: 'error', error: `Auth session failed: ${result.type}` });
            }
          }
        })
        .catch((error) => {
          console.error('[OAuth] Auth session error:', error);
          subscription.remove();
          resolve({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        });
    });
  };

  return { handleGoogleLogin };
};

