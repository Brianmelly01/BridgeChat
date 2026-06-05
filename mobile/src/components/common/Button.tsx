import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { darkColors as C } from '../../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style, size = 'md' }: ButtonProps) {
  const isDisabled = disabled || loading;
  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} style={[{ opacity: isDisabled ? 0.6 : 1 }, style]} activeOpacity={0.85}>
        <LinearGradient colors={['#6C63FF', '#FF6584']} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.base, { height: heights[size], borderRadius: size === 'sm' ? 10 : 14 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <View style={styles.content}>
              {icon && <Ionicons name={icon as any} size={18} color="#fff" style={styles.icon} />}
              <Text style={[styles.primaryText, { fontSize: fontSizes[size] }]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, any> = {
    secondary: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.primary },
    ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.border },
    danger: { backgroundColor: C.error },
  };

  const textColors: Record<string, string> = { secondary: C.primary, ghost: C.textSecondary, danger: '#fff' };

  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} style={[styles.base, variantStyles[variant], { height: heights[size], borderRadius: size === 'sm' ? 10 : 14, opacity: isDisabled ? 0.6 : 1 }, style]} activeOpacity={0.85}>
      {loading ? <ActivityIndicator color={variant === 'danger' ? '#fff' : C.primary} /> : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon as any} size={18} color={textColors[variant]} style={styles.icon} />}
          <Text style={[styles.baseText, { color: textColors[variant], fontSize: fontSizes[size] }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', shadowColor: '#6C63FF', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:6 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: {},
  primaryText: { color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
  baseText: { fontWeight: '600', letterSpacing: 0.3 },
});
