import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { darkColors as C } from '../../theme/colors';
import { authService } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
    } catch (err: any) {
      Alert.alert('Login Failed', err?.response?.data?.error || 'An error occurred');
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E', '#0F3460']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient colors={['#6C63FF', '#FF6584']} style={styles.logoCircle} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Text style={{fontSize:32}}>⬡</Text>
            </LinearGradient>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to BridgeChat</Text>
          </View>

          {/* Card */}
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.cardInner}>
              <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
              <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry={!showPassword} leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(v => !v)}
              />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
              <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.signInBtn} />

              {/* Divider */}
              <View style={styles.divider}><View style={styles.dividerLine}/><Text style={styles.dividerText}>or continue with</Text><View style={styles.dividerLine}/></View>

              {/* Social Buttons */}
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Text style={styles.socialBtnText}>🔵  Continue with Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialBtn, {marginTop: 10}]} activeOpacity={0.8}>
                <Text style={styles.socialBtnText}>⬛  Continue with Apple</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32, gap: 12 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#6C63FF', shadowOffset:{width:0,height:8}, shadowOpacity:0.4, shadowRadius:16, elevation:10 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: C.textMuted },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.glassBorder, marginBottom: 24 },
  cardInner: { padding: 24, gap: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -8 },
  forgotText: { color: C.primary, fontSize: 14 },
  signInBtn: { marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { color: C.textMuted, fontSize: 13 },
  socialBtn: { backgroundColor: C.surface, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  socialBtnText: { color: C.text, fontSize: 15, fontWeight: '600' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  registerText: { color: C.textMuted, fontSize: 14 },
  registerLink: { color: C.primary, fontSize: 14, fontWeight: '700' },
});
