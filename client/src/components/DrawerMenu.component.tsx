import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { View } from '../shared/components/View.component';
import { DrawerHeader } from './drawer/DrawerHeader.component';
import { DrawerMenuItems } from './drawer/DrawerMenuItems.component';
import { DrawerChatHistory } from './drawer/DrawerChatHistory.component';
import { DrawerUserInfo } from './drawer/DrawerUserInfo.component';

type DrawerMenuProps = {
  onClose: () => void;
  userName?: string;
  onNewChat?: () => void;
};

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  onClose,
  userName,
  onNewChat,
}) => {
  return (
    <>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </View>

      <View style={styles.drawer}>
        <View className="flex-1 flex-col">
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <DrawerHeader onClose={onClose} />
            <DrawerMenuItems onClose={onClose} onNewChat={onNewChat} />
            <DrawerChatHistory />
          </ScrollView>

          {userName && <DrawerUserInfo userName={userName} />}
        </View>
      </View>
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
