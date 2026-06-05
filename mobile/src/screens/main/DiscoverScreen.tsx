import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { discoveryService } from '../../services/apiServices';
import Avatar from '../../components/common/Avatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DiscoveredUser {
  id: string; username: string; displayName: string; avatarUrl?: string | null;
  isOnline: boolean; isVerified: boolean; bio?: string | null; distance?: number;
}

export default function DiscoverScreen() {
  const navigation = useNavigation<Nav>();
  const [users, setUsers] = useState<DiscoveredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'nearby' | 'online'>('nearby');

  const loadNearby = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        loadOnline(); return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await discoveryService.getNearbyUsers(loc.coords.latitude, loc.coords.longitude, 10);
      setUsers(res.data.data.users);
    } catch { loadOnline(); } finally { setLoading(false); setRefreshing(false); }
  };

  const loadOnline = async () => {
    try {
      const res = await discoveryService.getOnlineUsers();
      setUsers(res.data.data.users);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { activeTab === 'nearby' ? loadNearby() : loadOnline(); }, [activeTab]);

  const tabs = [{ key: 'nearby', label: '📍 Nearby', icon: 'location-outline' }, { key: 'online', label: '🟢 Online', icon: 'radio-outline' }];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity style={styles.qrBtn}>
          <Ionicons name="qr-code-outline" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key as any)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}>
            {activeTab === tab.key
              ? <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.tabGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={styles.tabTextActive}>{tab.label}</Text>
                </LinearGradient>
              : <Text style={styles.tabText}>{tab.label}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); activeTab === 'nearby' ? loadNearby() : loadOnline(); }} tintColor={C.primary} />}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userCard} onPress={() => navigation.navigate('UserProfile', { userId: item.id })} activeOpacity={0.85}>
            <LinearGradient colors={['#1A1A2E','#0F3460']} style={styles.cardGrad}>
              <View style={styles.avatarWrapper}>
                <Avatar uri={item.avatarUrl} name={item.displayName} size={56} isOnline={item.isOnline} />
              </View>
              <Text style={styles.userName} numberOfLines={1}>{item.displayName}</Text>
              <Text style={styles.userHandle} numberOfLines={1}>@{item.username}</Text>
              {item.distance !== undefined && (
                <Text style={styles.distance}>📍 {item.distance.toFixed(1)} km</Text>
              )}
              <TouchableOpacity style={styles.connectBtn} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
                <Text style={styles.connectBtnText}>View Profile</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔭</Text>
            <Text style={styles.emptyTitle}>No one found</Text>
            <Text style={styles.emptySubtitle}>Try switching tabs or expand your radius</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  qrBtn: { padding: 8, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: C.surface, borderRadius: 14, padding: 4, gap: 4, borderWidth: 1, borderColor: C.border },
  tab: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  tabActive: {},
  tabGrad: { paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabText: { paddingVertical: 10, textAlign: 'center', color: C.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  row: { gap: 12, marginBottom: 12 },
  userCard: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border, shadowColor: '#6C63FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:10, elevation:6 },
  cardGrad: { padding: 16, alignItems: 'center', gap: 8 },
  avatarWrapper: { marginBottom: 4 },
  userName: { fontSize: 15, fontWeight: '700', color: C.text, textAlign: 'center' },
  userHandle: { fontSize: 12, color: C.textMuted, textAlign: 'center' },
  distance: { fontSize: 12, color: C.primary, fontWeight: '600' },
  connectBtn: { backgroundColor: 'rgba(108,99,255,0.2)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, marginTop: 4, borderWidth: 1, borderColor: C.primary },
  connectBtnText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
});
