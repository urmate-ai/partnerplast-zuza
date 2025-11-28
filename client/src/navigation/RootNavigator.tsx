import React, { useEffect, useRef } from 'react';
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
      const { path, queryParams } = Linking.parse(event.url);
      
      if (path === 'reset-password' && queryParams?.token) {
        navigationRef.current?.navigate('ResetPassword', {
          token: queryParams.token as string,
        });
      } else if (path === 'auth/google/callback') {
        const token = queryParams?.token as string;
        const userJson = queryParams?.user as string;
        const error = queryParams?.error as string;
        
        if (error) {
          console.error('Google OAuth error:', error);
          return;
        }
        
        if (token && userJson) {
          try {
            const user = JSON.parse(decodeURIComponent(userJson));
            await useAuthStore.getState().setAuth(user, token);
            navigationRef.current?.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          } catch (err) {
            console.error('Failed to parse user data:', err);
          }
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
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
      <NavigationContainer ref={navigationRef}>
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


