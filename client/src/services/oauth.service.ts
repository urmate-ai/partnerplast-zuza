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
        const { path, queryParams } = Linking.parse(event.url);
        
        if (path === 'auth/google/callback') {
          subscription.remove();
          WebBrowser.dismissBrowser();
          
          const code = queryParams?.code as string;
          const error = queryParams?.error as string;
          
          if (error) {
            resolve({ type: 'error', error });
            return;
          }
          
          if (code) {
            try {
              const response = await fetch(`${API_URL}/api/v1/auth/google/exchange`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
              });

              if (!response.ok) {
                throw new Error('Failed to exchange code for token');
              }

              const data = await response.json();
              resolve({ type: 'success', token: data.accessToken, user: data.user });
            } catch (err) {
              resolve({ type: 'error', error: 'Failed to exchange code for token' });
            }
          } else {
            resolve({ type: 'error', error: 'Missing code' });
          }
        }
      });

      WebBrowser.openBrowserAsync(`${API_URL}/api/v1/auth/google`)
        .then((result) => {
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

