import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { darkColors as C } from '../../theme/colors';
import { groupService } from '../../services/apiServices';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function CreateGroupScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Group name is required'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('isPublic', String(isPublic));
      formData.append('memberIds', JSON.stringify([]));
      if (avatarUri) {
        formData.append('avatar', { uri: avatarUri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      }
      await groupService.createGroup(formData);
      Alert.alert('Success', 'Group created!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create group');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar picker */}
        <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <LinearGradient colors={['#6C63FF', '#FF6584']} style={styles.avatarPlaceholder} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="camera-outline" size={32} color="#fff" />
              <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
            </LinearGradient>
          )}
          <View style={styles.avatarEdit}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <Input label="Group Name *" value={name} onChangeText={setName} placeholder="My Awesome Group" leftIcon="people-outline" />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="What's this group about?" leftIcon="document-text-outline" multiline numberOfLines={3} />

          {/* Public / Private toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Visibility</Text>
              <Text style={styles.toggleSub}>{isPublic ? 'Anyone can find and join' : 'Invite only'}</Text>
            </View>
            <TouchableOpacity onPress={() => setIsPublic(v => !v)} style={[styles.toggle, isPublic && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.visibilityLabel, { color: isPublic ? C.success : C.textMuted }]}>
            {isPublic ? '🌐 Public Group' : '🔒 Private Group'}
          </Text>

          <Button title="Create Group" onPress={handleCreate} loading={loading} style={styles.createBtn} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  scroll: { padding: 24, gap: 24 },
  avatarPicker: { alignSelf: 'center', position: 'relative' },
  avatarImage: { width: 100, height: 100, borderRadius: 28, borderWidth: 3, borderColor: C.primary },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 6 },
  avatarPlaceholderText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, backgroundColor: C.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.background },
  form: { gap: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  toggleInfo: { gap: 3 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  toggleSub: { fontSize: 12, color: C.textMuted },
  toggle: { width: 50, height: 28, backgroundColor: C.border, borderRadius: 14, padding: 3 },
  toggleActive: { backgroundColor: C.primary },
  toggleThumb: { width: 22, height: 22, backgroundColor: '#fff', borderRadius: 11 },
  toggleThumbActive: { transform: [{ translateX: 22 }] },
  visibilityLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  createBtn: { marginTop: 8 },
});
