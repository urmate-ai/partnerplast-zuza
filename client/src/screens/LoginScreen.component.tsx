import React from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { useLoginScreen } from '../shared/hooks/useLoginScreen.hook';
import { LoginForm } from '../components/login/LoginForm.component';
import { SocialLogin } from '../components/login/SocialLogin.component';
import type { RootStackParamList } from '../navigation/RootNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {
    control,
    errors,
    showPassword,
    onTogglePassword,
    emailSubmitted,
    setEmailSubmitted,
    onEmailSubmit,
    handlePasswordSubmit,
    isLoading,
    loginError,
    getValues,
    onEmailChange,
    handleGoogleLogin,
    handleAppleLogin,
  } = useLoginScreen({ navigation });

  return (
    <View className="flex-1 bg-white px-6">
      <View className="flex-1 justify-center items-center">
        <View className="w-full max-w-md">
          <Text variant="h1" className="text-center mb-8">
            Witaj ponownie
          </Text>

          <LoginForm
            control={control}
            errors={errors}
            showPassword={showPassword}
            onTogglePassword={onTogglePassword}
            emailSubmitted={emailSubmitted}
            onEmailSubmit={onEmailSubmit}
            onPasswordSubmit={handlePasswordSubmit}
            isLoading={isLoading}
            loginError={loginError}
            getValues={getValues}
            onEmailChange={onEmailChange}
            onEmailChangeRequest={() => setEmailSubmitted(false)}
          />

          <View className="flex-row justify-center items-center mt-6">
            <Text variant="caption" className="text-gray-500">
              Nie masz konta?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text variant="caption" className="text-gray-900 font-semibold">
                Zarejestruj się
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-200" />
            <Text variant="caption" className="mx-4 text-gray-400 font-medium">
              LUB
            </Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <SocialLogin
            onGoogleLogin={handleGoogleLogin}
            onAppleLogin={handleAppleLogin}
          />
        </View>
      </View>
    </View>
  );
};
