import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export type User = {
  id: string;
  email: string;
  name: string;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
};

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://partnerplast-zuza.onrender.com';

// Pomocnicza funkcja do weryfikacji tokenu (bez użycia apiClient, aby uniknąć cyklicznej zależności)
async function verifyTokenWithServer(token: string): Promise<User | null> {
  try {
    const response = await axios.get<{ success: boolean; data: User }>(`${API_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user, token) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  },

  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  },

  loadAuth: async () => {
    try {
      console.log('[AuthStore] 🔄 Ładowanie autoryzacji...');
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        
        // Weryfikuj token z serwerem
        console.log('[AuthStore] 🔍 Weryfikacja tokenu z serwerem...');
        const verifiedUser = await verifyTokenWithServer(token);
        
        if (verifiedUser) {
          console.log('[AuthStore] ✅ Token ważny - użytkownik zalogowany');
          set({ user: verifiedUser, token, isAuthenticated: true, isLoading: false });
        } else {
          console.warn('[AuthStore] ❌ Token nieważny lub wygasły - wylogowywanie');
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        console.log('[AuthStore] ℹ️ Brak zapisanego tokenu');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[AuthStore] ❌ Błąd podczas ładowania autoryzacji:', error);
      set({ isLoading: false });
    }
  },

  verifyToken: async () => {
    const state = useAuthStore.getState();
    if (!state.token) {
      return false;
    }

    const verifiedUser = await verifyTokenWithServer(state.token);
    if (!verifiedUser) {
      await state.clearAuth();
      return false;
    }
    return true;
  },
}));

