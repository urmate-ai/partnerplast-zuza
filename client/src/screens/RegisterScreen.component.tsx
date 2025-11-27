import React, { useEffect, useRef } from 'react';
import { Pressable, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from '../shared/components/View.component';
import { Text } from '../shared/components/Text.component';
import { useRegisterScreen } from '../shared/hooks/useRegisterScreen.hook';
import { RegisterForm } from '../components/register/RegisterForm.component';
import type { RootStackParamList } from '../navigation/RootNavigator';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Register'
>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const {
    control,
    errors,
    currentStep,
    isLoading,
    registerError,
    onNext,
    onBack,
    getStepTitle,
    getStepPlaceholder,
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
    <View className="flex-1 bg-white pt-14 px-6">
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
          <Text variant="h1" className="mb-8">
            {getStepTitle()}
          </Text>

          <RegisterForm
            control={control}
            errors={errors}
            currentStep={currentStep}
            getStepPlaceholder={getStepPlaceholder}
            onNext={onNext}
            isLoading={isLoading}
            getButtonText={getButtonText}
            registerError={registerError}
          />

          <View className="flex-row justify-center items-center mt-6">
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
    </View>
  );
};
