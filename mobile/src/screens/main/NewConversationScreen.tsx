import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { userService, conversationService } from '../../services/apiServices';
import { useChatStore } from '../../store/chatStore';
import Avatar from '../../components/common/Avatar';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function NewConversationScreen() {
  const navigation = useNavigation<Nav>();
  const { addConversation } = useChatStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await userService.searchUsers(query);
        setResults(res.data.data.users);
      } catch {} finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const startChat = async (user: any) => {
    try {
      const res = await conversationService.createConversation({ type: 'DIRECT', participantId: user.id });
      const conv = res.data.data.conversation;
      addConversation({ ...conv, unreadCount: 0, participants: [] });
      navigation.replace('Chat', { conversationId: conv.id, title: user.displayName, avatarUrl: user.avatarUrl, isOnline: user.isOnline });
    } catch (e: any) {
      if (e?.response?.data?.data?.conversationId) {
        navigation.replace('Chat', { conversationId: e.response.data.data.conversationId, title: user.displayName, avatarUrl: user.avatarUrl });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Message</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search people..." placeholderTextColor={C.textDisabled} style={styles.searchInput} autoFocus />
        {loading && <ActivityIndicator size="small" color={C.primary} />}
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => startChat(item)} activeOpacity={0.75}>
            <Avatar uri={item.avatarUrl} name={item.displayName} size="md" isOnline={item.isOnline} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.displayName}</Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
            <Ionicons name="chatbubble-outline" size={20} color={C.primary} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={query.length > 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found for "{query}"</Text>
          </View>
        ) : query.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Search for someone to message</Text>
          </View>
        ) : null}
        contentContainerStyle={results.length === 0 ? { flex: 1 } : {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  userItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: C.text },
  userHandle: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  sep: { height: 1, backgroundColor: C.border, marginLeft: 76 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: C.textMuted, fontSize: 15 },
});
