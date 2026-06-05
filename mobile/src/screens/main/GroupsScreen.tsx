import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { groupService } from '../../services/apiServices';
import Avatar from '../../components/common/Avatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await groupService.getPublicGroups();
      setGroups(res.data.data.groups);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateGroup')}>
          <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.createGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{height: 12}} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.groupCard} activeOpacity={0.85}>
            <LinearGradient colors={['#1A1A2E','#16213E']} style={styles.cardGrad}>
              <View style={styles.cardLeft}>
                <Avatar uri={item.avatarUrl} name={item.name} size="lg" showOnlineIndicator={false} />
                <View style={styles.groupInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                    {item.isPublic
                      ? <View style={styles.publicBadge}><Text style={styles.publicBadgeText}>Public</Text></View>
                      : <View style={[styles.publicBadge, {backgroundColor:'rgba(239,68,68,0.15)', borderColor:C.error}]}><Text style={[styles.publicBadgeText,{color:C.error}]}>Private</Text></View>}
                  </View>
                  <Text style={styles.groupDesc} numberOfLines={2}>{item.description || 'No description'}</Text>
                  <Text style={styles.memberCount}>👥 {item.memberCount?.toLocaleString() || 0} members</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.joinBtn} onPress={() => groupService.joinGroup(item.id).then(load).catch(() => {})}>
                <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.joinGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={styles.joinBtnText}>Join</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No communities yet</Text>
            <Text style={styles.emptySubtitle}>Create the first one!</Text>
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
  createBtn: { shadowColor:'#6C63FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.4, shadowRadius:10, elevation:8 },
  createGrad: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  groupCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  cardGrad: { padding: 16, gap: 12 },
  cardLeft: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  groupInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupName: { fontSize: 16, fontWeight: '700', color: C.text, flex: 1 },
  publicBadge: { backgroundColor: 'rgba(108,99,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.primary },
  publicBadgeText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  groupDesc: { fontSize: 13, color: C.textMuted, lineHeight: 18 },
  memberCount: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },
  joinBtn: { borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-end' },
  joinGrad: { paddingHorizontal: 20, paddingVertical: 10 },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 14, color: C.textMuted },
});
