import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View } from './View.component';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Szukaj...',
  className = '',
}) => {
  return (
    <View className={`flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2 ${className}`}>
      <Ionicons name="search-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-base text-gray-900"
        style={{ fontSize: 16, color: '#111827' }}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          activeOpacity={0.7}
          className="p-1"
        >
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

