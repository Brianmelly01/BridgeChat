import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { darkColors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');
type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'> };

export default function SplashScreen({ navigation }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      setTimeout(() => navigation.replace('Onboarding'), 2200);
    });
  }, []);

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E', '#0F3460']} style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }, { scale: pulseAnim }], opacity: opacityAnim }]}>
        <LinearGradient colors={['#6C63FF', '#FF6584']} style={styles.logoCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.logoIcon}>⬡</Text>
        </LinearGradient>
        <Text style={styles.logoText}>Bridge<Text style={styles.logoTextAccent}>Chat</Text></Text>
        <Text style={styles.tagline}>Connect · Discover · Communicate</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: opacityAnim }]}>
        <Text style={styles.footerText}>Secure • Private • Fast</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', gap: 16 },
  logoCircle: { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  logoIcon: { fontSize: 48, color: '#fff' },
  logoText: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  logoTextAccent: { color: '#FF6584' },
  tagline: { fontSize: 14, color: darkColors.textMuted, letterSpacing: 1, marginTop: 4 },
  footer: { position: 'absolute', bottom: 48 },
  footerText: { color: darkColors.textMuted, fontSize: 12, letterSpacing: 2 },
});
