import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { darkColors as C } from '../../theme/colors';

export default function PrivacyScreen() {
  const navigation = useNavigation<any>();
  const [lastSeen, setLastSeen] = useState<'everyone'|'followers'|'nobody'>('followers');
  const [profileVisible, setProfileVisible] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <TouchableOpacity onPress={onToggle} style={[styles.toggle, value && styles.toggleActive]}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Last seen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Seen</Text>
          {(['everyone', 'followers', 'nobody'] as const).map(opt => (
            <TouchableOpacity key={opt} style={styles.radioItem} onPress={() => setLastSeen(opt)}>
              <View style={[styles.radio, lastSeen === opt && styles.radioActive]}>
                {lastSeen === opt && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          {[
            { label: 'Public Profile', value: profileVisible, onToggle: () => setProfileVisible(v => !v), sub: 'Anyone can view your profile' },
            { label: 'Read Receipts', value: readReceipts, onToggle: () => setReadReceipts(v => !v), sub: 'Show when you\'ve read messages' },
            { label: 'Online Status', value: onlineStatus, onToggle: () => setOnlineStatus(v => !v), sub: 'Show when you\'re active' },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.toggleItem, i < arr.length - 1 && styles.itemBorder]}>
              <View style={styles.toggleItemInfo}>
                <Text style={styles.toggleItemLabel}>{item.label}</Text>
                <Text style={styles.toggleItemSub}>{item.sub}</Text>
              </View>
              <Toggle value={item.value} onToggle={item.onToggle} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  scroll: { padding: 16, gap: 20 },
  section: { backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },
  radioLabel: { fontSize: 15, color: C.text, fontWeight: '500' },
  toggleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  toggleItemInfo: { flex: 1, gap: 2 },
  toggleItemLabel: { fontSize: 15, color: C.text, fontWeight: '500' },
  toggleItemSub: { fontSize: 12, color: C.textMuted },
  toggle: { width: 48, height: 26, backgroundColor: C.border, borderRadius: 13, padding: 2 },
  toggleActive: { backgroundColor: C.primary },
  toggleThumb: { width: 22, height: 22, backgroundColor: '#fff', borderRadius: 11 },
  toggleThumbActive: { transform: [{ translateX: 22 }] },
});
