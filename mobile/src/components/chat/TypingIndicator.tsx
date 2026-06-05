import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { darkColors as C } from '../../theme/colors';

export default function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const bounce = (dot: Animated.Value, delay: number) =>
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(600),
    ]));

  useEffect(() => {
    Animated.parallel([bounce(dot1, 0), bounce(dot2, 150), bounce(dot3, 300)]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 6 },
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.textMuted },
});
