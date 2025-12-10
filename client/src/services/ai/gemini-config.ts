import Constants from 'expo-constants';

export function getGeminiApiKey(): string | undefined {
  return Constants.expoConfig?.extra?.geminiApiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
}

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

