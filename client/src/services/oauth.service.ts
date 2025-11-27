import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from '../shared/utils/api';

WebBrowser.maybeCompleteAuthSession();

export const loginWithGoogle = async (): Promise<{ accessToken: string; user: any }> => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'urmate-ai-zuza',
      path: 'auth/google/callback',
    });

    const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000';
    const authUrl = `${baseURL}/auth/google?state=${encodeURIComponent(redirectUri)}`;
    
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
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
};

