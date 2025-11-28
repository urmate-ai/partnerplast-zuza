require('@testing-library/jest-native/extend-expect');

// Mock react-native/jest modules to avoid Flow/ES module syntax errors
jest.mock('react-native/jest/mock', () => ({}), { virtual: true });
jest.mock('react-native/jest/setup', () => ({}), { virtual: true });

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
  },
  InterruptionModeIOS: {},
  InterruptionModeAndroid: {},
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
