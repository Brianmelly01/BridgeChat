import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { darkColors as C } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/apiServices';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!displayName.trim()) { Alert.alert('Error', 'Display name is required'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName.trim());
      formData.append('bio', bio.trim());
      formData.append('location', location.trim());
      if (avatarUri) formData.append('avatar', { uri: avatarUri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      const res = await userService.updateProfile(formData);
      updateUser(res.data.data.user);
      Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const currentAvatar = avatarUri || user?.avatarUrl;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar}>
          {currentAvatar ? (
            <Image source={{ uri: currentAvatar }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={['#6C63FF','#FF6584']} style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user?.displayName?.[0]?.toUpperCase() || '?'}</Text>
            </LinearGradient>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.changePhotoText}>Change Photo</Text>

        <View style={styles.form}>
          <Input label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" leftIcon="person-outline" />
          <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell people about yourself..." leftIcon="document-text-outline" multiline numberOfLines={3} maxLength={200} />
          <Input label="Location" value={location} onChangeText={setLocation} placeholder="City, Country" leftIcon="location-outline" />
          <Text style={styles.charCount}>{bio.length}/200</Text>
          <Button title="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center', gap: 8 },
  avatarWrapper: { marginTop: 20, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: C.primary },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 42, color: '#fff', fontWeight: '700' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: C.primary, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.background },
  changePhotoText: { color: C.primary, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  form: { width: '100%', gap: 14 },
  charCount: { color: C.textMuted, fontSize: 12, alignSelf: 'flex-end', marginTop: -10 },
});
