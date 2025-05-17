import { useAppTheme } from '../contexts/ThemeContext';
import { StyleSheet } from 'react-native';

export function useTheming() {
  const { theme, isDarkMode, toggleTheme } = useAppTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    surface: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding: 16,
      margin: 16,
    },
    text: {
      color: theme.colors.text,
    },
  });

  return {
    theme,
    isDarkMode,
    toggleTheme,
    styles,
  };
} 