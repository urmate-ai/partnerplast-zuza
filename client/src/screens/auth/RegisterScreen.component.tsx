import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';
import { SafeAreaView } from '../../shared/components/SafeAreaView.component';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRegisterScreen } from '../../shared/hooks/auth/useRegisterScreen.hook';
import { RegisterForm } from '../../components/register/RegisterForm.component';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const {
    control,
    errors,
    currentStep,
    isLoading,
    registerError,
    onNext,
    onBack,
    getStepTitle,
    getButtonText,
  } = useRegisterScreen({ navigation });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(20);
        prevStepRef.current = currentStep;
        
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [currentStep, fadeAnim, slideAnim]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, 14),
          paddingBottom: Math.max(insets.bottom, 20),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row justify-between items-center mb-8">
          <Pressable onPress={onBack} className="py-2 pr-4">
            <Text className="text-base text-gray-900 font-medium">Wróć</Text>
          </Pressable>
          <Text className="text-sm text-gray-500">
            Krok {currentStep === 'name' ? 1 : currentStep === 'email' ? 2 : 3} z 3
          </Text>
        </View>

        <View className="flex-1">
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}
          >
            <Text variant="h1" className="mb-4">
              {getStepTitle()}
            </Text>

            <RegisterForm
              control={control}
              errors={errors}
              currentStep={currentStep}
              onNext={onNext}
              isLoading={isLoading}
              getButtonText={getButtonText}
              registerError={registerError}
            />

            <View className="flex-row justify-center items-center mt-10">
              <Text variant="caption" className="text-gray-500">
                Masz już konto?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text variant="caption" className="text-gray-900 font-semibold">
                  Zaloguj się
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
