import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { LoginScreen } from '../screens/LoginScreen.component';
import { RegisterScreen } from '../screens/RegisterScreen.component';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen.component';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen.component';
import { HomeScreen } from '../screens/HomeScreen.component';
import { SettingsScreen } from '../screens/SettingsScreen.component';
import { EditProfileScreen } from '../screens/EditProfileScreen.component';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen.component';
import { IntegrationsScreen } from '../screens/IntegrationsScreen.component';
import { SearchChatsScreen } from '../screens/SearchChatsScreen.component';
import { ChatDetailScreen } from '../screens/ChatDetailScreen.component';
import { useAuthStore } from '../stores/authStore';
import { ToastProvider } from '../shared/components/Toast.component';

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
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      
      if (path === 'reset-password' && queryParams?.token) {
        navigationRef.current?.navigate('ResetPassword', {
          token: queryParams.token as string,
        });
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
      <ToastProvider>
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
      </ToastProvider>
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


