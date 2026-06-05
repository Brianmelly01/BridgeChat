import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { darkColors as C } from '../../theme/colors';
import { authService } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState({ username: '', email: '', phone: '', displayName: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.username.trim()) { Alert.alert('Error', 'Username is required'); return false; }
    if (form.username.length < 3) { Alert.alert('Error', 'Username must be at least 3 characters'); return false; }
    if (!form.email.trim() && !form.phone.trim()) { Alert.alert('Error', 'Email or phone number is required'); return false; }
    if (!form.displayName.trim()) { Alert.alert('Error', 'Display name is required'); return false; }
    if (form.password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return false; }
    if (form.password !== form.confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        displayName: form.displayName.trim(),
      });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.response?.data?.error || 'An error occurred');
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E', '#0F3460']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join BridgeChat today</Text>
          </View>

          <BlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.cardInner}>
              <Input label="Display Name" value={form.displayName} onChangeText={set('displayName')} placeholder="Your full name" leftIcon="person-outline" />
              <Input label="Username" value={form.username} onChangeText={set('username')} placeholder="@username" autoCapitalize="none" leftIcon="at-outline" />
              <Input label="Email" value={form.email} onChangeText={set('email')} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
              <Input label="Phone (optional)" value={form.phone} onChangeText={set('phone')} placeholder="+1 234 567 8900" keyboardType="phone-pad" leftIcon="call-outline" />
              <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="Min. 8 characters" secureTextEntry={!showPassword} leftIcon="lock-closed-outline" rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'} onRightIconPress={() => setShowPassword(v => !v)} />
              <Input label="Confirm Password" value={form.confirmPassword} onChangeText={set('confirmPassword')} placeholder="Repeat password" secureTextEntry={!showPassword} leftIcon="lock-closed-outline" />
              <Button title="Create Account" onPress={handleRegister} loading={loading} style={{marginTop: 8}} />
            </View>
          </BlurView>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28, gap: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: C.textMuted },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.glassBorder, marginBottom: 24 },
  cardInner: { padding: 24, gap: 14, backgroundColor: 'rgba(255,255,255,0.04)' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: C.textMuted, fontSize: 14 },
  loginLink: { color: C.primary, fontSize: 14, fontWeight: '700' },
});
