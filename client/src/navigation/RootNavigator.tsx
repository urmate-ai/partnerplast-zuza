import React, { useEffect, useRef, useMemo } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { LoginScreen } from '../screens/auth/LoginScreen.component';
import { RegisterScreen } from '../screens/auth/RegisterScreen.component';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen.component';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen.component';
import { HomeScreen } from '../screens/chat/HomeScreen.component';
import { SettingsScreen } from '../screens/settings/SettingsScreen.component';
import { EditProfileScreen } from '../screens/settings/EditProfileScreen.component';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen.component';
import { IntegrationsScreen } from '../screens/integrations/IntegrationsScreen.component';
import { SearchChatsScreen } from '../screens/chat/SearchChatsScreen.component';
import { ChatDetailScreen } from '../screens/chat/ChatDetailScreen.component';
import { useAuthStore } from '../stores/authStore';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Home: undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Integrations: undefined;
  SearchChats: undefined;
  ChatDetail: { chatId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, loadAuth } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const linking = useMemo(() => ({
    prefixes: [
      Linking.createURL('/'),
      'urmate-ai-zuza://',
      'exp://192.168.1.100:8081', 
    ],
    config: {
      screens: {
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot-password',
        ResetPassword: 'reset-password',
        Home: 'home',
        Settings: 'settings',
        EditProfile: 'edit-profile',
        ChangePassword: 'change-password',
        Integrations: 'integrations',
        SearchChats: 'search-chats',
        ChatDetail: 'chat/:chatId',
      },
    },
    // Dodaj subscribe do obsługi deep linków, które nie pasują do żadnej ścieżki
    subscribe(listener: (url: string) => void) {
      const onReceiveURL = ({ url }: { url: string }) => {
        console.log('[Navigation] Subscribe received URL:', url);
        const { path } = Linking.parse(url);
        
        console.log('[Navigation] Subscribe parsed path:', path);
        
        // Jeśli to auth/google/callback (zarówno dla standalone jak i Expo Go), 
        // nie przekazuj do React Navigation - oauth.service.ts obsłuży to
        if (path === 'auth/google/callback' || path?.includes('auth/google/callback')) {
          console.log('[Navigation] Ignoring auth/google/callback in navigation');
          return;
        }
        
        // Dla innych ścieżek, przekaż do React Navigation
        listener(url);
      };

      const subscription = Linking.addEventListener('url', onReceiveURL);

      return () => {
        subscription.remove();
      };
    },
  }), []);

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && navigationRef.current) {
      if (isAuthenticated) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[Navigation] handleDeepLink received:', event.url);
      const { path, queryParams } = Linking.parse(event.url);
      console.log('[Navigation] handleDeepLink parsed - path:', path, 'queryParams:', queryParams);
      
      if (path === 'reset-password' && queryParams?.token) {
        navigationRef.current?.navigate('ResetPassword', {
          token: queryParams.token as string,
        });
      } else if (path === 'auth/google/callback' || path?.includes('auth/google/callback')) {
        const code = queryParams?.code as string;
        const error = queryParams?.error as string;
        
        console.log('[Navigation] Google callback detected - code:', !!code, 'error:', error);
        
        if (error) {
          console.error('[Navigation] Google OAuth error:', error);
          return;
        }
        
        if (code) {
          console.log('[Navigation] Code received, will be handled by oauth.service');
          // oauth.service.ts ma własny listener, który obsłuży wymianę code na token
          return;
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[Navigation] Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer 
        ref={navigationRef}
        linking={linking}
        onReady={() => {
          console.log('[Navigation] NavigationContainer ready');
        }}
        onStateChange={(state) => {
          console.log('[Navigation] State changed:', state);
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="Integrations" component={IntegrationsScreen} />
          <Stack.Screen name="SearchChats" component={SearchChatsScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});


