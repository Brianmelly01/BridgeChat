import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { darkColors as C } from '../../theme/colors';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [settings, setSettings] = useState({
    messages: true, calls: true, groups: true, mentions: true,
    follows: true, sounds: true, vibration: true, preview: true,
  });

  const toggle = (key: keyof typeof settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const groups = [
    { title: 'Activity', items: [
      { key: 'messages', label: 'New Messages', sub: 'Notify when you receive a message', icon: 'chatbubble-outline' },
      { key: 'calls', label: 'Calls', sub: 'Incoming voice and video calls', icon: 'call-outline' },
      { key: 'groups', label: 'Group Activity', sub: 'Messages in your groups', icon: 'people-outline' },
      { key: 'mentions', label: 'Mentions', sub: 'When someone mentions you', icon: 'at-outline' },
      { key: 'follows', label: 'New Followers', sub: 'When someone follows you', icon: 'person-add-outline' },
    ]},
    { title: 'Sound & Vibration', items: [
      { key: 'sounds', label: 'Notification Sounds', sub: 'Play sound for notifications', icon: 'volume-high-outline' },
      { key: 'vibration', label: 'Vibration', sub: 'Vibrate on notification', icon: 'phone-portrait-outline' },
      { key: 'preview', label: 'Message Preview', sub: 'Show message content in notification', icon: 'eye-outline' },
    ]},
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {groups.map(group => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.items.map((item, i) => (
                <View key={item.key} style={[styles.item, i < group.items.length - 1 && styles.itemBorder]}>
                  <View style={styles.iconWrapper}><Ionicons name={item.icon as any} size={18} color={C.primary} /></View>
                  <View style={styles.itemText}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemSub}>{item.sub}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggle(item.key as any)} style={[styles.toggle, settings[item.key as keyof typeof settings] && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, settings[item.key as keyof typeof settings] && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  scroll: { padding: 16, gap: 20 },
  group: { gap: 8 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },
  card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(108,99,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, gap: 2 },
  itemLabel: { fontSize: 15, color: C.text, fontWeight: '500' },
  itemSub: { fontSize: 12, color: C.textMuted },
  toggle: { width: 48, height: 26, backgroundColor: C.border, borderRadius: 13, padding: 2 },
  toggleActive: { backgroundColor: C.primary },
  toggleThumb: { width: 22, height: 22, backgroundColor: '#fff', borderRadius: 11 },
  toggleThumbActive: { transform: [{ translateX: 22 }] },
});
