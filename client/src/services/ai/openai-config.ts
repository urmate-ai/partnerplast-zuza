export const getOpenAIApiKey = (): string | undefined => {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY;
};

export const OPENAI_API_BASE = 'https://api.openai.com/v1';

