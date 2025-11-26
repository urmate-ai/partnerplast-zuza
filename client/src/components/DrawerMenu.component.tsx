import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getChatHistory } from '../services/ai.service';

type DrawerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
};

type ChatHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
};

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  userName,
}) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
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

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getChatHistory();
      setChatHistory(history);
    } catch (error) {
      console.error('Błąd pobierania historii:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.drawerContent}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>Z</Text>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <Pressable style={styles.menuItem}>
                <Ionicons name="create-outline" size={20} color="#111827" style={styles.menuIcon} />
                <Text style={styles.menuText}>Nowy czat</Text>
              </Pressable>

              <Pressable style={styles.menuItem}>
                <Ionicons name="search-outline" size={20} color="#111827" style={styles.menuIcon} />
                <Text style={styles.menuText}>Wyszukaj czaty</Text>
              </Pressable>

              <Pressable style={styles.menuItem}>
                <Ionicons name="link-outline" size={20} color="#111827" style={styles.menuIcon} />
                <Text style={styles.menuText}>Integracje</Text>
              </Pressable>

              <Pressable style={styles.menuItem}>
                <Ionicons name="settings-outline" size={20} color="#111827" style={styles.menuIcon} />
                <Text style={styles.menuText}>Ustawienia</Text>
              </Pressable>
            </View>

            {/* Chat History Section */}
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Twoje czaty</Text>
              
              {isLoadingHistory ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6B7280" />
                  <Text style={styles.loadingText}>Ładowanie...</Text>
                </View>
              ) : chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <Pressable
                    key={chat.id}
                    style={styles.historyItem}
                    onPress={() => {
                      // TODO: Navigate to chat
                      console.log('Otwórz czat:', chat.id);
                    }}
                  >
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {chat.title}
                      </Text>
                      <Text style={styles.historyTimestamp}>{chat.timestamp}</Text>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyHistoryText}>
                  Brak historii czatów
                </Text>
              )}
            </View>
          </ScrollView>

          {/* User Info - na dole */}
          {userName && (
            <View style={styles.userInfo}>
              <View style={styles.userInfoLeft}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {userName
                      .split(' ')
                      .map((n) => n.charAt(0))
                      .join('')
                      .toUpperCase()
                      .substring(0, 2)}
                  </Text>
                </View>
                <View style={styles.userInfoText}>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.userStatus}>Free</Text>
                </View>
              </View>
              <Pressable style={styles.expandButton}>
                <Text style={styles.expandButtonText}>Rozszerz</Text>
              </Pressable>
            </View>
          )}
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
  drawerContent: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#374151',
    borderTopWidth: 1,
    borderTopColor: '#4B5563',
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  expandButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4B5563',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  menuSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  historySection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  historyItemContent: {
    flex: 1,
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  historyTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});

