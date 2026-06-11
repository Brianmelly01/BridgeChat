import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import NetInfo, { NetInfoWifiState } from '@react-native-community/netinfo';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { discoveryService, conversationService } from '../../services/apiServices';
import Avatar from '../../components/common/Avatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'wifi' | 'nearby' | 'online';

interface DiscoveredUser {
  id: string; username: string; displayName: string;
  avatarUrl?: string | null; isOnline: boolean; isVerified: boolean;
  bio?: string | null; distance?: number; isPrivate?: boolean;
}

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('wifi');
  const [users, setUsers] = useState<DiscoveredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wifiSSID, setWifiSSID] = useState<string | null>(null);
  const [wifiStatus, setWifiStatus] = useState<'detecting' | 'joined' | 'none' | 'error'>('detecting');
  const [statusMsg, setStatusMsg] = useState('');

  // ── WiFi Tab ────────────────────────────────────────────────────────────────
  const joinWifiNetwork = useCallback(async () => {
    setWifiStatus('detecting');
    setStatusMsg('Detecting your WiFi network…');
    try {
      const info = await NetInfo.fetch() as NetInfoWifiState;
      let ssid: string | null = info.details?.ssid ?? null;

      // On Android, location permission needed for SSID
      if (!ssid) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const refetched = await NetInfo.fetch() as NetInfoWifiState;
          ssid = refetched.details?.ssid ?? null;
        }
      }

      if (!ssid || ssid === '<unknown ssid>') {
        setWifiStatus('none');
        setWifiSSID(null);
        setStatusMsg('No WiFi detected. Connect to a WiFi network first.');
        setUsers([]);
        setLoading(false);
        return;
      }

      setWifiSSID(ssid);
      setStatusMsg(`Connected to "${ssid}"`);

      // Tell backend which network we're on
      await discoveryService.joinWifi(ssid);
      setWifiStatus('joined');

      // Now fetch users on this network
      const res = await discoveryService.getWifiUsers();
      setUsers(res.data.data.users ?? []);
      const msg = res.data.data.message;
      if (msg) setStatusMsg(msg);
    } catch (e) {
      setWifiStatus('error');
      setStatusMsg('Could not detect WiFi. Check permissions.');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Nearby Tab ──────────────────────────────────────────────────────────────
  const loadNearby = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { loadOnline(); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await discoveryService.getNearbyUsers(loc.coords.latitude, loc.coords.longitude, 10);
      setUsers(res.data.data.users ?? []);
    } catch { loadOnline(); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  // ── Online Tab ──────────────────────────────────────────────────────────────
  const loadOnline = useCallback(async () => {
    try {
      const res = await discoveryService.getOnlineUsers();
      setUsers(res.data.data.users ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setUsers([]);
    if (tab === 'wifi') joinWifiNetwork();
    else if (tab === 'nearby') loadNearby();
    else loadOnline();
  }, [tab]);

  useEffect(() => { loadData(); }, [tab]);

  // ── Start Chat with WiFi user ─────────────────────────────────────────────
  const startChat = async (user: DiscoveredUser) => {
    try {
      const res = await conversationService.create({
        type: 'DIRECT',
        participantIds: [user.id],
      });
      const conv = res.data.data.conversation;
      navigation.navigate('Chat', {
        conversationId: conv.id,
        name: user.displayName,
        avatarUrl: user.avatarUrl,
      });
    } catch {
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  // ── Render User Card ─────────────────────────────────────────────────────
  const renderUser = ({ item }: { item: DiscoveredUser }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      activeOpacity={0.85}
    >
      <LinearGradient colors={['#1A1A2E', '#0F3460']} style={styles.cardInner}>
        {/* Online dot */}
        <View style={styles.avatarRow}>
          <Avatar uri={item.avatarUrl} name={item.displayName} size={52} isOnline={item.isOnline} />
          {tab === 'wifi' && (
            <View style={styles.wifiBadge}>
              <Ionicons name="wifi" size={10} color="#fff" />
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1}>{item.displayName}</Text>
        <Text style={styles.handle} numberOfLines={1}>@{item.username}</Text>

        {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}

        {item.distance !== undefined && (
          <View style={styles.pill}>
            <Ionicons name="location" size={11} color={C.primary} />
            <Text style={styles.pillTxt}>{item.distance.toFixed(1)} km</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {tab === 'wifi' && (
            <TouchableOpacity style={styles.msgBtn} onPress={() => startChat(item)}>
              <LinearGradient colors={['#6C63FF', '#9C5FFF']} style={styles.msgGrad}>
                <Ionicons name="chatbubble" size={14} color="#fff" />
                <Text style={styles.msgTxt}>Message</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
          >
            <Text style={styles.profileTxt}>Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // ── WiFi Status Banner ───────────────────────────────────────────────────
  const WifiBanner = () => (
    <View style={[styles.banner, wifiStatus === 'joined' ? styles.bannerGreen : styles.bannerBlue]}>
      <Ionicons
        name={wifiStatus === 'joined' ? 'wifi' : wifiStatus === 'detecting' ? 'hourglass' : 'wifi-outline'}
        size={16}
        color={wifiStatus === 'joined' ? '#10B981' : C.primary}
      />
      <Text style={[styles.bannerTxt, wifiStatus === 'joined' && { color: '#10B981' }]}>
        {wifiStatus === 'detecting' ? 'Detecting WiFi…' :
         wifiStatus === 'joined' ? `On "${wifiSSID}"` :
         statusMsg || 'No WiFi network detected'}
      </Text>
      {wifiStatus !== 'detecting' && (
        <TouchableOpacity onPress={loadData} style={styles.refreshPill}>
          <Text style={styles.refreshPillTxt}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'wifi',   icon: 'wifi',             label: 'WiFi'   },
    { key: 'nearby', icon: 'location-outline', label: 'Nearby' },
    { key: 'online', icon: 'radio-outline',    label: 'Online' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Find people around you</Text>
        </View>
        <TouchableOpacity style={styles.qrBtn}>
          <Ionicons name="qr-code-outline" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={styles.tabItem} onPress={() => setTab(t.key)}>
              {active ? (
                <LinearGradient colors={['#6C63FF', '#FF6584']} style={styles.tabActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name={t.icon as any} size={15} color="#fff" />
                  <Text style={styles.tabActiveTxt}>{t.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <Ionicons name={t.icon as any} size={15} color={C.textMuted} />
                  <Text style={styles.tabTxt}>{t.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* WiFi Banner */}
      {tab === 'wifi' && <WifiBanner />}

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadTxt}>
            {tab === 'wifi' ? 'Scanning your WiFi network…' : 'Loading…'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={i => i.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.primary} />
          }
          renderItem={renderUser}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{tab === 'wifi' ? '📡' : tab === 'nearby' ? '🗺️' : '🌐'}</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'wifi' ? 'No BridgeChat users on your WiFi' :
                 tab === 'nearby' ? 'No one nearby' : 'No online users'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'wifi'
                  ? 'When friends join the same WiFi network and open BridgeChat, they\'ll appear here'
                  : 'Pull to refresh or try another tab'}
              </Text>
              {tab === 'wifi' && wifiStatus === 'none' && (
                <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
                  <Text style={styles.settingsBtnTxt}>Open WiFi Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.background },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title:         { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle:      { fontSize: 13, color: C.textMuted, marginTop: 2 },
  qrBtn:         { padding: 10, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border },

  tabBar:        { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surface, borderRadius: 14, padding: 4, gap: 4, borderWidth: 1, borderColor: C.border },
  tabItem:       { flex: 1, borderRadius: 10, overflow: 'hidden' },
  tabActive:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 5, borderRadius: 10 },
  tabActiveTxt:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  tabInactive:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 5 },
  tabTxt:        { color: C.textMuted, fontSize: 13, fontWeight: '500' },

  banner:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 14, gap: 8, borderWidth: 1 },
  bannerGreen:   { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  bannerBlue:    { backgroundColor: 'rgba(108,99,255,0.1)', borderColor: 'rgba(108,99,255,0.3)' },
  bannerTxt:     { flex: 1, fontSize: 13, color: C.primary, fontWeight: '500' },
  refreshPill:   { backgroundColor: 'rgba(108,99,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  refreshPillTxt:{ fontSize: 12, color: C.primary, fontWeight: '600' },

  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadTxt:       { color: C.textMuted, fontSize: 14, marginTop: 8 },

  list:          { paddingHorizontal: 12, paddingBottom: 100 },
  row:           { gap: 12, marginBottom: 12 },

  card:          { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, elevation: 6, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
  cardInner:     { padding: 16, alignItems: 'center', gap: 6 },
  avatarRow:     { position: 'relative', marginBottom: 4 },
  wifiBadge:     { position: 'absolute', bottom: 0, right: -2, backgroundColor: '#10B981', borderRadius: 8, padding: 3, borderWidth: 1.5, borderColor: C.background },

  name:          { fontSize: 15, fontWeight: '700', color: C.text, textAlign: 'center' },
  handle:        { fontSize: 12, color: C.textMuted, textAlign: 'center' },
  bio:           { fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 16 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(108,99,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pillTxt:       { fontSize: 11, color: C.primary, fontWeight: '600' },

  actions:       { flexDirection: 'row', gap: 6, marginTop: 6, width: '100%' },
  msgBtn:        { flex: 1, borderRadius: 10, overflow: 'hidden' },
  msgGrad:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  msgTxt:        { color: '#fff', fontSize: 12, fontWeight: '700' },
  profileBtn:    { flex: 1, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  profileTxt:    { color: C.textSecondary, fontSize: 12, fontWeight: '600' },

  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 60, gap: 12 },
  emptyIcon:     { fontSize: 52 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  settingsBtn:   { marginTop: 8, backgroundColor: 'rgba(108,99,255,0.2)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: C.primary },
  settingsBtnTxt:{ color: C.primary, fontSize: 13, fontWeight: '700' },
});
