import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { useChatStore, Message } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { messageService } from '../../services/apiServices';
import { socketService } from '../../services/socket';
import Avatar from '../../components/common/Avatar';
import MessageBubble from '../../components/chat/MessageBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import { formatLastSeen } from '../../utils/formatters';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'Chat'>;

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { conversationId, title, avatarUrl, isOnline } = route.params;
  const { user } = useAuthStore();
  const { messages, setMessages, prependMessages, addMessage, setActiveConversation, resetUnread, typingUsers } = useChatStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<any>(null);
  const convMessages = messages[conversationId] || [];
  const typingSet = typingUsers[conversationId] || new Set();
  const isTyping = typingSet.size > 0 && !typingSet.has(user?.id || '');

  useEffect(() => {
    setActiveConversation(conversationId);
    resetUnread(conversationId);
    socketService.joinConversation(conversationId);
    messageService.markAsRead(conversationId).catch(() => {});
    loadMessages();
    return () => {
      setActiveConversation(null);
      socketService.leaveConversation(conversationId);
      socketService.sendTypingStop(conversationId);
    };
  }, [conversationId]);

  const loadMessages = async (loadMore = false) => {
    try {
      const res = await messageService.getMessages(conversationId, loadMore ? cursor : undefined);
      const { messages: msgs, nextCursor } = res.data.data;
      if (loadMore) prependMessages(conversationId, msgs);
      else setMessages(conversationId, msgs);
      setCursor(nextCursor || undefined);
      setHasMore(!!nextCursor);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    socketService.sendTypingStop(conversationId);
    setSending(true);
    try {
      await messageService.sendMessage({ conversationId, content: trimmed, type: 'TEXT' });
    } catch (e) { Alert.alert('Error', 'Failed to send message'); setText(trimmed); }
    finally { setSending(false); }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    socketService.sendTypingStart(conversationId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketService.sendTypingStop(conversationId), 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => {}}>
          <Avatar uri={avatarUrl} name={title} size="sm" isOnline={isOnline} />
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>{title}</Text>
            <Text style={styles.headerStatus} numberOfLines={1}>{isOnline ? '🟢 Online' : 'Offline'}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AudioCall', { callId: '', remoteUserId: '', remoteUserName: title, isCaller: true })}>
            <Ionicons name="call-outline" size={22} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('VideoCall', { callId: '', remoteUserId: '', remoteUserName: title, isCaller: true })}>
            <Ionicons name="videocam-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav} keyboardVerticalOffset={0}>
        {loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={C.primary} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={convMessages}
            keyExtractor={item => item.id}
            inverted={false}
            renderItem={({ item, index }) => {
              const isMe = item.senderId === user?.id;
              const showAvatar = !isMe && (index === 0 || convMessages[index - 1]?.senderId !== item.senderId);
              return <MessageBubble message={item} isMe={isMe} showAvatar={showAvatar} />;
            }}
            onStartReached={() => hasMore && loadMessages(true)}
            onStartReachedThreshold={0.1}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="attach-outline" size={24} color={C.textMuted} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              value={text}
              onChangeText={handleTextChange}
              placeholder="Message..."
              placeholderTextColor={C.textDisabled}
              style={styles.textInput}
              multiline
              maxLength={4000}
            />
          </View>
          <TouchableOpacity style={styles.micBtn} onPress={text.trim() ? handleSend : undefined}>
            {text.trim() ? (
              <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.sendGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                <Ionicons name="send" size={20} color="#fff" />
              </LinearGradient>
            ) : (
              <Ionicons name="mic-outline" size={24} color={C.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  backBtn: { padding: 6, marginRight: 4 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: C.text },
  headerStatus: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8 },
  kav: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesList: { paddingHorizontal: 12, paddingVertical: 16, gap: 2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface, gap: 8 },
  attachBtn: { padding: 6, marginBottom: 4 },
  inputWrapper: { flex: 1, backgroundColor: C.inputBg, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.border, maxHeight: 120 },
  textInput: { fontSize: 15, color: C.text, maxHeight: 100 },
  micBtn: { marginBottom: 2 },
  sendGrad: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor:'#6C63FF', shadowOffset:{width:0,height:3}, shadowOpacity:0.4, shadowRadius:8, elevation:6 },
});
