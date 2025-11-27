import React from 'react';
import { Pressable } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type SocialLoginProps = {
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
};

export const SocialLogin: React.FC<SocialLoginProps> = ({
  onGoogleLogin,
  onAppleLogin,
}) => {
  return (
    <View className="gap-3">
      <Pressable onPress={onGoogleLogin}>
        <View className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3.5">
          <AntDesign name="google" size={20} color="#DB4437" />
          <Text className="ml-3 text-[15px] font-medium text-gray-900">
            Kontynuuj z Google
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={onAppleLogin}>
        <View className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3.5">
          <AntDesign name="apple" size={20} color="#000000" />
          <Text className="ml-3 text-[15px] font-medium text-gray-900">
            Kontynuuj z Apple
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

