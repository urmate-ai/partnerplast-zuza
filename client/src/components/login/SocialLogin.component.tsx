import React from 'react';
import { Pressable } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { View } from '../../shared/components/View.component';
import { Text } from '../../shared/components/Text.component';

type SocialLoginProps = {
  onGoogleLogin?: () => void;
  googleError?: string | null;
};

export const SocialLogin: React.FC<SocialLoginProps> = ({
  onGoogleLogin,
  googleError,
}) => {
  return (
    <View className="gap-3 items-center">
      <Pressable onPress={onGoogleLogin} style={{ alignSelf: 'stretch' }}>
        <View
          className={`flex-row items-center justify-center rounded-xl border px-4 py-3.5 ${
            googleError ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
          }`}
          style={{ width: '100%' }}
        >
          <View className="flex-row items-center justify-center flex-1">
            <AntDesign name="google" size={20} color="#DB4437" />
            <Text className="ml-3 text-[15px] font-medium text-gray-900">
              Kontynuuj z Google
            </Text>
          </View>
        </View>
      </Pressable>
      {googleError && (
        <Text className="text-red-500 text-sm mt-1 px-1 text-center">
          {googleError}
        </Text>
      )}
    </View>
  );
};

