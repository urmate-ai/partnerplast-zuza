import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://urmate-ai-zuza.onrender.com';

export const useGoogleAuth = () => {
  const handleGoogleLogin = async () => {
    try {
      const authUrl = `${API_URL}/api/v1/auth/google`;
      
      console.log('Opening Google OAuth URL:', authUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'urmate-ai-zuza://auth/google/callback'
      );

      console.log('WebBrowser result:', result);

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        return {
          type: 'success',
          token: queryParams?.token as string,
          user: queryParams?.user ? JSON.parse(decodeURIComponent(queryParams.user as string)) : null,
          error: queryParams?.error as string,
        };
      }

      return { type: result.type };
    } catch (error) {
      console.error('Google login error:', error);
      return { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { handleGoogleLogin };
};

