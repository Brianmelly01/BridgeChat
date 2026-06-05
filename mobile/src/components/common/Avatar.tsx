import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { darkColors as C } from '../../theme/colors';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  isOnline?: boolean;
  showOnlineIndicator?: boolean;
  style?: any;
}

const SIZES: Record<string, number> = { xs: 28, sm: 36, md: 48, lg: 64, xl: 80 };

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]?.toUpperCase()).slice(0, 2).join('');
}

function getColorFromName(name?: string): string {
  const colors = ['#6C63FF', '#FF6584', '#43E8D8', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function Avatar({ uri, name, size = 'md', isOnline, showOnlineIndicator = true, style }: AvatarProps) {
  const sz = typeof size === 'number' ? size : SIZES[size];
  const indicatorSize = sz * 0.28;
  const fontSize = sz * 0.36;
  const bgColor = getColorFromName(name);

  return (
    <View style={[{ width: sz, height: sz }, style]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: sz, height: sz, borderRadius: sz / 2 }} />
      ) : (
        <View style={[styles.initials, { width: sz, height: sz, borderRadius: sz / 2, backgroundColor: bgColor }]}>
          <Text style={[styles.initialsText, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      {showOnlineIndicator && isOnline !== undefined && (
        <View style={[styles.indicator, {
          width: indicatorSize, height: indicatorSize, borderRadius: indicatorSize / 2,
          backgroundColor: isOnline ? C.online : C.offline,
          bottom: 1, right: 1,
        }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  initials: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: '#fff', fontWeight: '700' },
  indicator: { position: 'absolute', borderWidth: 2, borderColor: C.background },
});
