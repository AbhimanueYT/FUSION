import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useAppTheme } from '@/contexts/ThemeContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import TaskContextProvider from '@/contexts/TaskContext';

function AppContent() {
  const { theme } = useAppTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <CalendarProvider>
              <SettingsProvider>
                <NotificationProvider>
                  <TaskContextProvider>
                    <Slot />
                  </TaskContextProvider>
                </NotificationProvider>
              </SettingsProvider>
            </CalendarProvider>
          </AuthProvider>
        </PaperProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default AppContent; 