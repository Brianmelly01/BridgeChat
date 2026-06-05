import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { darkColors as C } from '../../theme/colors';
import Avatar from '../common/Avatar';
import { formatChatTime } from '../../utils/formatters';

interface ConversationItemProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  lastMessage?: { type: string; content?: string | null; isDeleted: boolean; sender?: { id: string; displayName: string } } | null;
  lastMessageAt?: string;
  unreadCount?: number;
  isOnline?: boolean;
  isMuted?: boolean;
  currentUserId?: string;
  onPress: () => void;
}

function getPreview(msg: ConversationItemProps['lastMessage'], currentUserId?: string): string {
  if (!msg) return 'No messages yet';
  if (msg.isDeleted) return 'Message deleted';
  const isMe = msg.sender?.id === currentUserId;
  const prefix = isMe ? 'You: ' : '';
  if (msg.type === 'TEXT') return `${prefix}${msg.content || ''}`;
  if (msg.type === 'IMAGE') return `${prefix}📷 Photo`;
  if (msg.type === 'VIDEO') return `${prefix}🎥 Video`;
  if (msg.type === 'AUDIO' || msg.type === 'VOICE_NOTE') return `${prefix}🎤 Voice note`;
  if (msg.type === 'DOCUMENT') return `${prefix}📄 Document`;
  return `${prefix}${msg.content || ''}`;
}

export default function ConversationItem({ name, avatarUrl, lastMessage, lastMessageAt, unreadCount = 0, isOnline, isMuted, currentUserId, onPress }: ConversationItemProps) {
  const preview = getPreview(lastMessage, currentUserId);
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <Avatar uri={avatarUrl} name={name} size="lg" isOnline={isOnline} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>{name}</Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {lastMessageAt ? formatChatTime(lastMessageAt) : ''}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.preview, hasUnread && styles.previewBold]} numberOfLines={1}>{preview}</Text>
          <View style={styles.badges}>
            {isMuted && <Text style={styles.mutedIcon}>🔕</Text>}
            {hasUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 15, color: C.text, fontWeight: '500', flex: 1, marginRight: 8 },
  nameBold: { fontWeight: '700' },
  time: { fontSize: 12, color: C.textMuted },
  timeUnread: { color: C.primary },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: { fontSize: 13, color: C.textMuted, flex: 1, marginRight: 8 },
  previewBold: { color: C.textSecondary, fontWeight: '500' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mutedIcon: { fontSize: 12 },
  badge: { backgroundColor: C.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
