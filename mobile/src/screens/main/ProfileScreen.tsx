import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/common/Avatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile'), color: C.primary },
    { icon: 'shield-outline', label: 'Privacy & Security', onPress: () => navigation.navigate('Privacy'), color: '#43E8D8' },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => navigation.navigate('NotificationsSettings'), color: C.warning },
    { icon: 'settings-outline', label: 'Settings', onPress: () => navigation.navigate('Settings'), color: C.textSecondary },
    { icon: 'log-out-outline', label: 'Sign Out', onPress: () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]), color: C.error },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <LinearGradient colors={['#6C63FF','#FF6584','#43E8D8']} style={styles.cover} start={{x:0,y:0}} end={{x:1,y:1}} />

        {/* Profile info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={user?.avatarUrl} name={user?.displayName} size={88} showOnlineIndicator={false} />
            {user?.isVerified && <View style={styles.verifiedBadge}><Text style={{fontSize:16}}>✅</Text></View>}
          </View>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          {user?.bio && <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>}

          <View style={styles.statsRow}>
            {[['Posts', '0'], ['Followers', '0'], ['Following', '0']].map(([label, count]) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statCount}>{count}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map(item => (
            <TouchableOpacity key={item.label} onPress={item.onPress} style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}22` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, item.label === 'Sign Out' && { color: C.error }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>BridgeChat v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  cover: { height: 140 },
  profileSection: { alignItems: 'center', padding: 20, paddingTop: 0, gap: 8 },
  avatarWrapper: { marginTop: -44, marginBottom: 8, position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: C.background, borderRadius: 12, padding: 2 },
  displayName: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  username: { fontSize: 15, color: C.textMuted },
  bio: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 40, marginVertical: 12 },
  stat: { alignItems: 'center', gap: 2 },
  statCount: { fontSize: 20, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.textMuted },
  editBtn: { backgroundColor: C.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 32, borderWidth: 1.5, borderColor: C.border },
  editBtnText: { color: C.text, fontWeight: '600', fontSize: 15 },
  menu: { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  version: { textAlign: 'center', color: C.textMuted, fontSize: 12, padding: 24 },
});
