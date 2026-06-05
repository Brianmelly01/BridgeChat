import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

export { darkColors, lightColors, typography, spacing, borderRadius, shadows };
export type { ColorScheme };

export interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

export const createTheme = (isDark: boolean): Theme => ({
  colors: isDark ? darkColors : lightColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  isDark,
});

export const useThemeColors = (): ColorScheme => {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
};
