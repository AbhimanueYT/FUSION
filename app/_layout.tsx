import 'react-native-reanimated';
import { ThemeProvider, useAppTheme } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import TaskProvider from '../src/contexts/TaskContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, StatusBar, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

enableScreens(true);

function AppContent() {
  const { theme } = useAppTheme();
  
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.surface);
      StatusBar.setBarStyle('dark-content');
    }
  }, [theme]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <NotificationProvider>
                <TaskProvider>
                  <CalendarProvider>
                    <AppContent />
                  </CalendarProvider>
                </TaskProvider>
              </NotificationProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
} 