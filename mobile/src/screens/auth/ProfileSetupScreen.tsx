import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { darkColors as C } from '../../theme/colors';
import { userService } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function ProfileSetupScreen() {
  const navigation = useNavigation<any>();
  const { updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleComplete = async () => {
    if (!displayName.trim()) { Alert.alert('Error', 'Please enter your display name'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName.trim());
      formData.append('bio', bio.trim());
      if (avatarUri) formData.append('avatar', { uri: avatarUri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      const res = await userService.updateProfile(formData);
      updateUser(res.data.data.user);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to set up profile');
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.headerSection}>
              <Text style={styles.stepText}>Almost there! 🎉</Text>
              <Text style={styles.title}>Set up your profile</Text>
              <Text style={styles.subtitle}>Add a photo and name so people can recognize you</Text>
            </View>

            <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#6C63FF', '#FF6584']} style={styles.avatarPlaceholder} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Ionicons name="camera-outline" size={40} color="#fff" />
                </LinearGradient>
              )}
              <View style={styles.editBadge}><Ionicons name="add" size={18} color="#fff" /></View>
              <Text style={styles.addPhotoText}>Add Profile Photo</Text>
            </TouchableOpacity>

            <View style={styles.formSection}>
              <Input label="Display Name *" value={displayName} onChangeText={setDisplayName} placeholder="How should we call you?" leftIcon="person-outline" />
              <Input label="Bio (optional)" value={bio} onChangeText={setBio} placeholder="A short intro about yourself..." leftIcon="document-text-outline" multiline numberOfLines={3} maxLength={160} />
              <Button title="Complete Setup →" onPress={handleComplete} loading={loading} style={{ marginTop: 12 }} />
              <TouchableOpacity style={styles.skipBtn} onPress={() => {}}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  headerSection: { alignItems: 'center', marginBottom: 36, gap: 8 },
  stepText: { fontSize: 14, color: C.primary, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 36, gap: 12, position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: C.primary },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', shadowColor: '#6C63FF', shadowOffset:{width:0,height:8}, shadowOpacity:0.4, shadowRadius:16, elevation:10 },
  editBadge: { position: 'absolute', bottom: 32, right: '36%', backgroundColor: C.primary, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.background },
  addPhotoText: { color: C.primary, fontSize: 14, fontWeight: '600' },
  formSection: { gap: 14 },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: C.textMuted, fontSize: 14 },
});
