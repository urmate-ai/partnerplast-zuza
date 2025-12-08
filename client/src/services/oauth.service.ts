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
      const subscription = Linking.addEventListener('url', async (event) => {
        console.log('[OAuth] Deep link received:', event.url);
        const { path, queryParams } = Linking.parse(event.url);
        
        if (path === 'auth/google/callback') {
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
      
      console.log('[OAuth] Opening browser with redirect URL:', redirectUrl);
      console.log('[OAuth] Auth URL:', authUrl);

      WebBrowser.openBrowserAsync(authUrl)
        .then((result) => {
          console.log('[OAuth] Browser result:', result);
          if (result.type === 'cancel' || result.type === 'dismiss') {
            subscription.remove();
            resolve({ type: 'cancel' });
          }
        })
        .catch((error) => {
          console.error('[OAuth] Browser error:', error);
          subscription.remove();
          resolve({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        });
    });
  };

  return { handleGoogleLogin };
};

