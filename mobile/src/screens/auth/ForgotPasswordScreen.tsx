import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { darkColors as C } from '../../theme/colors';
import { authService } from '../../services/apiServices';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'> };

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E']} style={styles.gradient}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={C.text} />
      </TouchableOpacity>

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>{sent ? 'Check your email' : 'Forgot password?'}</Text>
          <Text style={styles.subtitle}>{sent ? `We sent a reset link to ${email}` : "No worries, we'll send you reset instructions."}</Text>
        </View>

        {!sent ? (
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.cardInner}>
              <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline" />
              <Button title="Send Reset Link" onPress={handleSend} loading={loading} style={{marginTop: 8}} />
            </View>
          </BlurView>
        ) : (
          <View style={styles.sentBox}>
            <Text style={styles.sentIcon}>✅</Text>
            <Text style={styles.sentText}>Reset link sent! Check your inbox.</Text>
            <Button title="Back to Login" onPress={() => navigation.replace('Login')} style={{marginTop: 24}} />
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={C.primary} />
          <Text style={styles.backLinkText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  back: { position: 'absolute', top: 56, left: 24, padding: 8, zIndex: 10 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 140, justifyContent: 'flex-start' },
  header: { alignItems: 'center', marginBottom: 32, gap: 12 },
  icon: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.glassBorder, marginBottom: 24 },
  cardInner: { padding: 24, gap: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
  sentBox: { alignItems: 'center', padding: 32 },
  sentIcon: { fontSize: 48, marginBottom: 16 },
  sentText: { color: C.textSecondary, fontSize: 16, textAlign: 'center' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  backLinkText: { color: C.primary, fontSize: 14, fontWeight: '600' },
});
