import { cssInterop } from 'nativewind';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';

// Register all React Native components that will use className with NativeWind
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(TextInput, { className: 'style' });
cssInterop(TouchableOpacity, { className: 'style' });
cssInterop(Pressable, { className: 'style' });
cssInterop(ScrollView, { className: 'style' });
cssInterop(FlatList, { className: 'style' });
cssInterop(Image, { className: 'style' });
cssInterop(ActivityIndicator, { className: 'style' });
