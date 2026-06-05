import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { darkColors as C } from '../../theme/colors';
import { authService } from '../../services/apiServices';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>; route: RouteProp<AuthStackParamList, 'OTPVerification'> };
const OTP_LENGTH = 6;

export default function OTPVerificationScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val.replace(/[^0-9]/g, '').slice(-1);
    setOtp(newOtp);
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { Alert.alert('Error', 'Please enter the full 6-digit code'); return; }
    setLoading(true);
    try {
      await authService.verifyEmail(code);
      Alert.alert('Success', 'Email verified! Welcome to BridgeChat.', [{ text: 'OK' }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Invalid code');
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E']} style={styles.gradient}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={C.text} />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.icon}>📩</Text>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to{'\n'}<Text style={styles.email}>{email}</Text></Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => { inputs.current[i] = el; }}
              value={digit}
              onChangeText={val => handleChange(val, i)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpInput, digit ? styles.otpInputFilled : {}]}
              selectionColor={C.primary}
              onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !digit && i > 0) inputs.current[i - 1]?.focus(); }}
            />
          ))}
        </View>

        <Button title="Verify Email" onPress={handleVerify} loading={loading} style={{marginBottom: 24}} />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {countdown > 0 ? (
            <Text style={styles.countdown}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={() => { setCountdown(60); }}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  back: { position: 'absolute', top: 56, left: 24, padding: 8, zIndex: 10 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 140, alignItems: 'center' },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  email: { color: C.primary, fontWeight: '600' },
  otpRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  otpInput: { width: 48, height: 56, borderRadius: 14, backgroundColor: C.surface, borderWidth: 2, borderColor: C.border, fontSize: 24, fontWeight: '700', color: C.text, textAlign: 'center' },
  otpInputFilled: { borderColor: C.primary, backgroundColor: 'rgba(108,99,255,0.1)' },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendText: { color: C.textMuted, fontSize: 14 },
  countdown: { color: C.textMuted, fontSize: 14 },
  resendLink: { color: C.primary, fontSize: 14, fontWeight: '700' },
});
