import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export const googleAuthConfig = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export const useGoogleAuth = () => {
  const redirectUri = makeRedirectUri({
    scheme: 'urmate-ai-zuza',
    path: 'auth/google/callback',
  });

  console.log('Google OAuth Redirect URI:', redirectUri);

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...googleAuthConfig,
    redirectUri,
  });

  return { request, response, promptAsync };
};

