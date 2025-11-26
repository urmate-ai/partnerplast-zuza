import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type MenuButtonProps = {
  onPress?: () => void;
};

export const MenuButton: React.FC<MenuButtonProps> = ({ onPress }) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      onPress={onPress}
      style={styles.button}
    >
      <View style={styles.line} />
      <View style={styles.line} />
      <View style={styles.line} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#111827',
    marginVertical: 1.5,
  },
});


