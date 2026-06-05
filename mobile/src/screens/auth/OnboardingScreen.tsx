import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { darkColors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const slides = [
  { id: '1', emoji: '🌐', title: 'Bridge Any Distance', subtitle: 'Connect with people near or far over any network — WiFi, cellular, or local area.', gradient: ['#6C63FF', '#4B44CC'] },
  { id: '2', emoji: '🔒', title: 'Secure by Design', subtitle: 'End-to-end encryption on every message. Your conversations stay private, always.', gradient: ['#FF6584', '#CC4466'] },
  { id: '3', emoji: '🎯', title: 'Discover People', subtitle: 'Find users on the same WiFi, nearby via Bluetooth, or through QR code sharing.', gradient: ['#43E8D8', '#22BDB0'] },
];

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'> };

export default function OnboardingScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <LinearGradient colors={['#0A0A0F', '#1A1A2E']} style={styles.slide}>
            <LinearGradient colors={item.gradient as [string,string]} style={styles.emojiCircle} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </LinearGradient>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </LinearGradient>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
          return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity }]} />;
        })}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={goNext} activeOpacity={0.85}>
          <LinearGradient colors={['#6C63FF', '#FF6584']} style={styles.btn} start={{x:0,y:0}} end={{x:1,y:0}}>
            <Text style={styles.btnText}>{activeIndex === slides.length - 1 ? 'Get Started 🚀' : 'Next'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        {activeIndex < slides.length - 1 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  slide: { width, height, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 24 },
  emojiCircle: { width: 140, height: 140, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#6C63FF', shadowOffset: {width:0,height:12}, shadowOpacity: 0.5, shadowRadius: 24, elevation: 16 },
  emoji: { fontSize: 64 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: darkColors.textSecondary, textAlign: 'center', lineHeight: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#6C63FF' },
  footer: { paddingHorizontal: 24, paddingBottom: 48, gap: 16 },
  btn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: '#6C63FF', shadowOffset: {width:0,height:6}, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: darkColors.textMuted, fontSize: 15 },
});
