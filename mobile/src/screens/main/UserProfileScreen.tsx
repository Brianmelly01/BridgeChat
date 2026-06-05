import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { userService, conversationService } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import Avatar from '../../components/common/Avatar';
import { formatLastSeen } from '../../utils/formatters';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { userId } = route.params;
  const { user: me } = useAuthStore();
  const { addConversation } = useChatStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    userService.getUserById(userId)
      .then(res => { setProfile(res.data.data.user); setFollowing(res.data.data.isFollowing); })
      .catch(() => Alert.alert('Error', 'Could not load profile'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    setActionLoading(true);
    try {
      if (following) { await userService.unfollowUser(userId); setFollowing(false); }
      else { await userService.followUser(userId); setFollowing(true); }
    } catch {} finally { setActionLoading(false); }
  };

  const handleMessage = async () => {
    try {
      const res = await conversationService.createConversation({ type: 'DIRECT', participantId: userId });
      const conv = res.data.data.conversation;
      addConversation({ ...conv, unreadCount: 0, participants: [] });
      navigation.navigate('Chat', { conversationId: conv.id, title: profile.displayName, avatarUrl: profile.avatarUrl, isOnline: profile.isOnline });
    } catch (e: any) {
      if (e?.response?.data?.data?.conversationId) {
        navigation.navigate('Chat', { conversationId: e.response.data.data.conversationId, title: profile.displayName, avatarUrl: profile.avatarUrl });
      }
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={C.primary} /></View>
  );

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={C.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.cover} start={{x:0,y:0}} end={{x:1,y:1}} />

        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={profile.avatarUrl} name={profile.displayName} size={88} isOnline={profile.isOnline} />
            {profile.isVerified && <View style={styles.badge}><Text>✅</Text></View>}
          </View>
          <Text style={styles.name}>{profile.displayName}</Text>
          <Text style={styles.handle}>@{profile.username}</Text>
          {profile.isOnline
            ? <Text style={styles.online}>🟢 Online</Text>
            : <Text style={styles.lastSeen}>{formatLastSeen(profile.lastSeen)}</Text>}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.statsRow}>
            {[['Followers', profile._count?.followers ?? 0], ['Following', profile._count?.following ?? 0]].map(([label, count]) => (
              <View key={label} style={styles.stat}>
                <Text style={styles.statCount}>{count}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {me?.id !== userId && (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.messageBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                  <Text style={styles.messageBtnText}>Message</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFollow} disabled={actionLoading}
                style={[styles.followBtn, following && styles.followBtnActive]}>
                {actionLoading ? <ActivityIndicator size="small" color={C.primary} /> : (
                  <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                    {following ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreBtn}
                onPress={() => Alert.alert('Options', '', [
                  { text: 'Block', style: 'destructive', onPress: () => userService.blockUser(userId) },
                  { text: 'Report', onPress: () => {} },
                  { text: 'Cancel', style: 'cancel' },
                ])}>
                <Ionicons name="ellipsis-horizontal" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Social links */}
        {profile.socialLinks?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links</Text>
            {profile.socialLinks.map((link: any) => (
              <View key={link.id} style={styles.socialLink}>
                <Ionicons name="link-outline" size={16} color={C.primary} />
                <Text style={styles.socialLinkText}>{link.platform}: {link.url}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  loadingContainer: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  back: { position: 'absolute', top: 56, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },
  cover: { height: 160 },
  profileSection: { alignItems: 'center', padding: 20, paddingTop: 0, gap: 6 },
  avatarWrapper: { marginTop: -44, marginBottom: 8, position: 'relative' },
  badge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: C.background, borderRadius: 12, padding: 2 },
  name: { fontSize: 24, fontWeight: '800', color: C.text },
  handle: { fontSize: 14, color: C.textMuted },
  online: { fontSize: 13, color: C.online, fontWeight: '600' },
  lastSeen: { fontSize: 13, color: C.textMuted },
  bio: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginVertical: 4 },
  statsRow: { flexDirection: 'row', gap: 48, marginVertical: 12 },
  stat: { alignItems: 'center', gap: 2 },
  statCount: { fontSize: 20, fontWeight: '800', color: C.text },
  statLabel: { fontSize: 12, color: C.textMuted },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4, alignItems: 'center' },
  messageBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  messageBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  messageBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  followBtn: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5, borderColor: C.primary },
  followBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  followBtnText: { color: C.primary, fontWeight: '700', fontSize: 15 },
  followBtnTextActive: { color: '#fff' },
  moreBtn: { padding: 11, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  socialLink: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  socialLinkText: { fontSize: 14, color: C.textSecondary },
});
