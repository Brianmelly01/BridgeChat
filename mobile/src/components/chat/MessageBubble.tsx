import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors as C } from '../../theme/colors';
import { Message } from '../../store/chatStore';
import Avatar from '../common/Avatar';
import { formatMessageTime, formatFileSize } from '../../utils/formatters';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showAvatar?: boolean;
}

export default function MessageBubble({ message, isMe, showAvatar }: MessageBubbleProps) {
  if (message.isDeleted) {
    return (
      <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
        {!isMe && showAvatar && <Avatar uri={message.sender.avatarUrl} name={message.sender.displayName} size="xs" showOnlineIndicator={false} />}
        {!isMe && !showAvatar && <View style={{ width: 28 }} />}
        <View style={[styles.deletedBubble, isMe ? styles.deletedBubbleMe : {}]}>
          <Ionicons name="ban-outline" size={14} color={C.textMuted} />
          <Text style={styles.deletedText}>Message deleted</Text>
        </View>
      </View>
    );
  }

  const bubbleBg = isMe ? C.bubbleOwn : C.bubbleOther;

  const renderContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <TouchableOpacity activeOpacity={0.9}>
            <Image source={{ uri: message.mediaUrl! }} style={styles.messageImage} resizeMode="cover" />
            {message.content ? <Text style={[styles.text, isMe ? styles.textMe : {}]}>{message.content}</Text> : null}
          </TouchableOpacity>
        );
      case 'VIDEO':
        return (
          <TouchableOpacity style={styles.videoThumb} activeOpacity={0.9}>
            <View style={styles.playBtn}><Ionicons name="play" size={28} color="#fff" /></View>
            <Text style={styles.videoLabel}>Video</Text>
          </TouchableOpacity>
        );
      case 'AUDIO':
      case 'VOICE_NOTE':
        return (
          <View style={styles.audioRow}>
            <TouchableOpacity style={styles.audioPlayBtn}>
              <Ionicons name="play" size={18} color={isMe ? '#fff' : C.primary} />
            </TouchableOpacity>
            <View style={styles.waveform}>
              {[...Array(20)].map((_, i) => (
                <View key={i} style={[styles.waveBar, { height: 4 + Math.random() * 20, backgroundColor: isMe ? 'rgba(255,255,255,0.6)' : C.primary }]} />
              ))}
            </View>
            <Text style={[styles.audioDuration, isMe ? styles.textMe : {}]}>0:00</Text>
          </View>
        );
      case 'DOCUMENT':
        return (
          <TouchableOpacity style={styles.docRow}>
            <Ionicons name="document-outline" size={28} color={isMe ? '#fff' : C.primary} />
            <View style={styles.docInfo}>
              <Text style={[styles.docName, isMe ? styles.textMe : {}]} numberOfLines={1}>{message.mediaName || 'Document'}</Text>
              <Text style={[styles.docSize, isMe ? styles.textMeSecondary : styles.textSecondary]}>{formatFileSize(message.mediaSize)}</Text>
            </View>
          </TouchableOpacity>
        );
      default:
        return <Text style={[styles.text, isMe ? styles.textMe : {}]}>{message.content}</Text>;
    }
  };

  const reactions = Object.entries(message.reactions || {});

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
      {!isMe && showAvatar && <Avatar uri={message.sender.avatarUrl} name={message.sender.displayName} size="xs" showOnlineIndicator={false} />}
      {!isMe && !showAvatar && <View style={{ width: 28 }} />}

      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : {}]}>
        {/* Reply preview */}
        {message.replyTo && (
          <View style={[styles.replyPreview, isMe ? styles.replyPreviewMe : {}]}>
            <View style={styles.replyBar} />
            <View>
              <Text style={styles.replyAuthor}>{message.replyTo.sender.displayName}</Text>
              <Text style={styles.replyContent} numberOfLines={1}>{message.replyTo.content || '📎 Media'}</Text>
            </View>
          </View>
        )}

        <View style={[styles.bubble, { backgroundColor: bubbleBg }, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {renderContent()}
          <View style={styles.metaRow}>
            {message.isEdited && <Text style={[styles.editedLabel, isMe ? styles.textMeSecondary : styles.textSecondary]}>edited</Text>}
            <Text style={[styles.time, isMe ? styles.textMeSecondary : styles.textSecondary]}>{formatMessageTime(message.createdAt)}</Text>
            {isMe && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />}
          </View>
        </View>

        {reactions.length > 0 && (
          <View style={[styles.reactionsRow, isMe ? styles.reactionsRowMe : {}]}>
            {reactions.slice(0, 5).map(([uid, emoji]) => (
              <Text key={uid} style={styles.reactionEmoji}>{emoji}</Text>
            ))}
            {reactions.length > 5 && <Text style={styles.reactionCount}>+{reactions.length - 5}</Text>}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 2, paddingHorizontal: 4 },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  bubbleWrapper: { maxWidth: '78%', gap: 4 },
  bubbleWrapperMe: { alignItems: 'flex-end' },
  bubble: { borderRadius: 18, padding: 12, gap: 4 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  text: { fontSize: 15, color: C.text, lineHeight: 20 },
  textMe: { color: '#fff' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: 2 },
  time: { fontSize: 11, color: C.textMuted },
  textSecondary: { color: C.textMuted },
  textMeSecondary: { color: 'rgba(255,255,255,0.6)' },
  editedLabel: { fontSize: 11, fontStyle: 'italic' },
  messageImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 4 },
  videoThumb: { width: 220, height: 140, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  playBtn: { backgroundColor: 'rgba(0,0,0,0.6)', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  videoLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180 },
  audioPlayBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { width: 3, borderRadius: 2, opacity: 0.8 },
  audioDuration: { fontSize: 11, color: C.textMuted, minWidth: 30 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 160 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: C.text },
  docSize: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  replyPreview: { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 8, flexDirection: 'row', gap: 8, marginBottom: 2 },
  replyPreviewMe: { backgroundColor: 'rgba(255,255,255,0.15)' },
  replyBar: { width: 3, backgroundColor: '#fff', borderRadius: 2, opacity: 0.8 },
  replyAuthor: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  replyContent: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  reactionsRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, gap: 2, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.border },
  reactionsRowMe: { alignSelf: 'flex-end' },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontSize: 11, color: C.textMuted, alignSelf: 'center' },
  deletedBubble: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.border },
  deletedBubbleMe: { backgroundColor: 'rgba(108,99,255,0.2)' },
  deletedText: { fontSize: 14, color: C.textMuted, fontStyle: 'italic' },
});
