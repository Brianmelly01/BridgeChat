import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { conversationService } from '../../services/apiServices';
import ConversationItem from '../../components/chat/ConversationItem';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { conversations, setConversations } = useChatStore();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const res = await conversationService.listConversations();
      setConversations(res.data.data.conversations);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadConversations(); }, []);

  const convList = Object.values(conversations)
    .filter(c => {
      if (!search) return true;
      const name = c.name || c.otherParticipant?.displayName || '';
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 Hello, {user?.displayName?.split(' ')[0]}</Text>
          <Text style={styles.title}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.newChatBtn} onPress={() => navigation.navigate('NewConversation')}>
          <LinearGradient colors={['#6C63FF', '#FF6584']} style={styles.newChatGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} style={styles.searchIcon} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search conversations..." placeholderTextColor={C.textDisabled} style={styles.searchInput} />
        {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={C.textMuted} /></TouchableOpacity>}
      </View>

      {/* List */}
      <FlatList
        data={convList}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConversations(); }} tintColor={C.primary} />}
        renderItem={({ item }) => (
          <ConversationItem
            id={item.id}
            name={item.name || item.otherParticipant?.displayName || 'Unknown'}
            avatarUrl={item.avatarUrl || item.otherParticipant?.avatarUrl}
            lastMessage={item.lastMessage}
            lastMessageAt={item.lastMessageAt}
            unreadCount={item.unreadCount}
            isOnline={item.otherParticipant?.isOnline}
            currentUserId={user?.id}
            onPress={() => navigation.navigate('Chat', {
              conversationId: item.id,
              title: item.name || item.otherParticipant?.displayName || 'Chat',
              avatarUrl: item.avatarUrl || item.otherParticipant?.avatarUrl || undefined,
            })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Start chatting with someone new</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('NewConversation')}>
                <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.emptyBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={styles.emptyBtnText}>Start a conversation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={convList.length === 0 ? { flex: 1 } : {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: 13, color: C.textMuted, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  newChatBtn: { shadowColor: '#6C63FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.4, shadowRadius:10, elevation:8 },
  newChatGrad: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  separator: { height: 1, backgroundColor: C.border, marginLeft: 76 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: C.text },
  emptySubtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
  emptyBtn: { marginTop: 8, borderRadius: 14, overflow: 'hidden', shadowColor:'#6C63FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:6 },
  emptyBtnGrad: { paddingVertical: 14, paddingHorizontal: 28 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
