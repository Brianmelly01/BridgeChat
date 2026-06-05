import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { darkColors as C } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const groups = [
    {
      title: 'Account', items: [
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile'), right: 'chevron' },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Security', onPress: () => navigation.navigate('Privacy'), right: 'chevron' },
        { icon: 'key-outline', label: 'Change Password', onPress: () => {}, right: 'chevron' },
      ]
    },
    {
      title: 'Notifications', items: [
        { icon: 'notifications-outline', label: 'Push Notifications', right: 'toggle', value: notifications, onToggle: setNotifications },
        { icon: 'volume-medium-outline', label: 'Sound', right: 'toggle', value: soundEnabled, onToggle: setSoundEnabled },
      ]
    },
    {
      title: 'Support', items: [
        { icon: 'help-circle-outline', label: 'Help Center', onPress: () => {}, right: 'chevron' },
        { icon: 'information-circle-outline', label: 'About BridgeChat', onPress: () => {}, right: 'chevron' },
      ]
    },
    {
      title: 'Danger Zone', items: [
        { icon: 'log-out-outline', label: 'Sign Out', onPress: () => Alert.alert('Sign Out', 'Sure?', [{ text: 'Cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]), danger: true, right: 'chevron' },
        { icon: 'trash-outline', label: 'Delete Account', onPress: () => {}, danger: true, right: 'chevron' },
      ]
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {groups.map(group => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item: any, idx) => (
                <TouchableOpacity key={item.label} onPress={item.onPress} style={[styles.item, idx < group.items.length - 1 && styles.itemBorder]} activeOpacity={item.onPress ? 0.7 : 1}>
                  <View style={[styles.itemIcon, { backgroundColor: item.danger ? 'rgba(239,68,68,0.1)' : 'rgba(108,99,255,0.1)' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.danger ? C.error : C.primary} />
                  </View>
                  <Text style={[styles.itemLabel, item.danger && { color: C.error }]}>{item.label}</Text>
                  {item.right === 'chevron' && <Ionicons name="chevron-forward" size={18} color={C.textMuted} />}
                  {item.right === 'toggle' && (
                    <TouchableOpacity onPress={() => item.onToggle?.(!item.value)} style={[styles.toggle, item.value && styles.toggleActive]}>
                      <View style={[styles.toggleThumb, item.value && styles.toggleThumbActive]} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.version}>BridgeChat v1.0.0 · Made with ❤️</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: C.text },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 20 },
  group: { gap: 8 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },
  groupCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
  toggle: { width: 48, height: 26, backgroundColor: C.border, borderRadius: 13, padding: 2, justifyContent: 'center' },
  toggleActive: { backgroundColor: C.primary },
  toggleThumb: { width: 22, height: 22, backgroundColor: '#fff', borderRadius: 11 },
  toggleThumbActive: { transform: [{ translateX: 22 }] },
  version: { textAlign: 'center', color: C.textMuted, fontSize: 12, marginTop: 8 },
});
