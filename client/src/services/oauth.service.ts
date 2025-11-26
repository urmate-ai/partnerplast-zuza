import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function loginWithGoogle(): Promise<{ accessToken: string; user: any }> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'urmate-ai-zuza',
      path: 'auth/google/callback',
    });

    const authUrl = `${API_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      // Parse token from URL
      const url = new URL(result.url);
      const token = url.searchParams.get('token');
      const userJson = url.searchParams.get('user');
      
      if (token && userJson) {
        return {
          accessToken: token,
          user: JSON.parse(decodeURIComponent(userJson)),
        };
      }
    }

    throw new Error('Google login cancelled or failed');
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
}

export async function loginWithApple(): Promise<{ accessToken: string; user: any }> {
  // Apple OAuth wymaga Apple Developer Account i konfiguracji
  // Placeholder implementation
  throw new Error('Apple OAuth not yet configured - requires Apple Developer setup');
}

