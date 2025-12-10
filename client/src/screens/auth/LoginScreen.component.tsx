import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { SafeAreaView } from '../../shared/components/SafeAreaView.component';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoginScreen } from '../../shared/hooks/auth/useLoginScreen.hook';
import { LoginForm } from '../../components/login/LoginForm.component';
import { SocialLogin } from '../../components/login/SocialLogin.component';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const insets = useSafeAreaInsets();
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
    googleError,
  } = useLoginScreen({ navigation });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
        }}
        keyboardShouldPersistTaps="handled"
      >
      <View className="flex-1 justify-center items-center">
        <View className="w-full max-w-md">
          <Text variant="h1" className="text-center mb-8">
            Cześć, Witaj ponownie !
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

          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            className="mt-4"
          >
            <View className="flex-row justify-center items-center">
              <Text variant="caption" className="text-center text-gray-600">
                Nie pamiętasz hasła?{' '}
              </Text>
              <Text variant="caption" className="text-left text-gray-900 font-semibold">
                Zresetuj hasło
              </Text>
            </View>
          </Pressable>

          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-200" />
            <Text variant="caption" className="mx-4 text-gray-400 font-medium">
              LUB
            </Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <SocialLogin
            onGoogleLogin={handleGoogleLogin}
            googleError={googleError}
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
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};
