import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet } from 'react-native';
import { View } from '../shared/components/View.component';
import { DrawerHeader } from './drawer/DrawerHeader.component';
import { DrawerMenuItems } from './drawer/DrawerMenuItems.component';
import { DrawerChatHistory } from './drawer/DrawerChatHistory.component';
import { DrawerUserInfo } from './drawer/DrawerUserInfo.component';

type DrawerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onNewChat?: () => void;
};

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  userName,
  onNewChat,
}) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        <View className="flex-1 flex-col">
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <DrawerHeader onClose={onClose} />
            <DrawerMenuItems onClose={onClose} onNewChat={onNewChat} />
            <DrawerChatHistory />
          </ScrollView>

          {userName && <DrawerUserInfo userName={userName} />}
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
});
