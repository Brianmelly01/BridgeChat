import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    semiBold: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    bold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    mono: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
};
