import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { darkColors as C } from '../theme/colors';

// Tab screens
import HomeScreen from '../screens/main/HomeScreen';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import GroupsScreen from '../screens/main/GroupsScreen';
import CallsScreen from '../screens/main/CallsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Stack screens
import ChatScreen from '../screens/main/ChatScreen';
import NewConversationScreen from '../screens/main/NewConversationScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import CreateGroupScreen from '../screens/main/CreateGroupScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import AudioCallScreen from '../screens/calls/AudioCallScreen';
import VideoCallScreen from '../screens/calls/VideoCallScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Chat: { conversationId: string; title: string; avatarUrl?: string; isOnline?: boolean };
  NewConversation: undefined;
  UserProfile: { userId: string };
  CreateGroup: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Privacy: undefined;
  NotificationsSettings: undefined;
  AudioCall: { callId: string; remoteUserId: string; remoteUserName: string; avatarUrl?: string; isCaller: boolean };
  VideoCall: { callId: string; remoteUserId: string; remoteUserName: string; avatarUrl?: string; isCaller: boolean };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ITEMS = [
  { name: 'Home', icon: 'chatbubbles', label: 'Chats' },
  { name: 'Discover', icon: 'compass', label: 'Discover' },
  { name: 'Groups', icon: 'people', label: 'Groups' },
  { name: 'Calls', icon: 'call', label: 'Calls' },
  { name: 'Profile', icon: 'person', label: 'Profile' },
];

const TAB_SCREENS: Record<string, React.ComponentType<any>> = {
  Home: HomeScreen,
  Discover: DiscoverScreen,
  Groups: GroupsScreen,
  Calls: CallsScreen,
  Profile: ProfileScreen,
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const item = TAB_ITEMS.find(t => t.name === route.name);
          const iconName = focused ? item?.icon : `${item?.icon}-outline`;
          return <Ionicons name={iconName as any} size={24} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          const item = TAB_ITEMS.find(t => t.name === route.name);
          return <Text style={[styles.tabLabel, { color }]}>{item?.label}</Text>;
        },
      })}
    >
      {TAB_ITEMS.map(item => (
        <Tab.Screen key={item.name} name={item.name} component={TAB_SCREENS[item.name]} />
      ))}
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="NewConversation" component={NewConversationScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsScreen} />
      <Stack.Screen name="AudioCall" component={AudioCallScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.surface,
    borderTopColor: C.border,
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 8,
    height: 64,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
