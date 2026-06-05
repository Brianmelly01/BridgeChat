import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors as C } from '../../theme/colors';
import { callService } from '../../services/apiServices';
import Avatar from '../../components/common/Avatar';
import { formatRelativeTime, formatDuration } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';

export default function CallsScreen() {
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await callService.getCallHistory();
      setCalls(res.data.data.calls);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const getCallIcon = (call: any) => {
    if (call.status === 'MISSED') return { name: 'call-outline', color: C.error };
    if (call.status === 'REJECTED') return { name: 'call-outline', color: C.error };
    if (call.direction === 'outgoing') return { name: 'arrow-up-outline', color: C.success };
    return { name: 'arrow-down-outline', color: C.primary };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
      </View>

      <FlatList
        data={calls}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          const other = item.participants?.find((p: any) => p.user?.id !== user?.id)?.user || item.caller;
          const icon = getCallIcon(item);
          return (
            <TouchableOpacity style={styles.callItem} activeOpacity={0.75}>
              <Avatar uri={other?.avatarUrl} name={other?.displayName} size="lg" showOnlineIndicator={false} />
              <View style={styles.callInfo}>
                <Text style={styles.callerName}>{other?.displayName || 'Unknown'}</Text>
                <View style={styles.callMeta}>
                  <Ionicons name={icon.name as any} size={14} color={icon.color} />
                  <Text style={[styles.callStatus, { color: icon.color }]}>
                    {item.status === 'MISSED' ? 'Missed' : item.status === 'REJECTED' ? 'Rejected' : item.direction === 'outgoing' ? 'Outgoing' : 'Incoming'}
                    {item.type === 'VIDEO' ? ' video' : ' voice'} call
                  </Text>
                  <Text style={styles.callTime}>· {formatRelativeTime(item.startedAt || item.createdAt)}</Text>
                </View>
                {item.duration > 0 && <Text style={styles.callDuration}>⏱ {formatDuration(item.duration)}</Text>}
              </View>
              <View style={styles.callActions}>
                <TouchableOpacity style={styles.callBackBtn}>
                  <LinearGradient colors={item.type === 'VIDEO' ? ['#43E8D8','#6C63FF'] : ['#6C63FF','#FF6584']} style={styles.callBackGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                    <Ionicons name={item.type === 'VIDEO' ? 'videocam' : 'call'} size={18} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyTitle}>No call history</Text>
            <Text style={styles.emptySubtitle}>Your calls will appear here</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  sep: { height: 1, backgroundColor: C.border, marginLeft: 76 },
  callItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  callInfo: { flex: 1, gap: 3 },
  callerName: { fontSize: 16, fontWeight: '600', color: C.text },
  callMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  callStatus: { fontSize: 13, fontWeight: '500' },
  callTime: { fontSize: 13, color: C.textMuted },
  callDuration: { fontSize: 12, color: C.textMuted },
  callActions: {},
  callBackBtn: { shadowColor:'#6C63FF', shadowOffset:{width:0,height:3}, shadowOpacity:0.4, shadowRadius:8, elevation:5 },
  callBackGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 14, color: C.textMuted },
});
