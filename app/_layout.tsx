import { useEffect } from 'react';
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { ThemeProvider, useAppTheme } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import TaskProvider from '../src/contexts/TaskContext';
import { PaperProvider } from 'react-native-paper';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { CalendarProvider } from '@/contexts/CalendarContext';

function AppContent() {
  const { theme } = useAppTheme();
  
  return (
    <PaperProvider theme={theme}>
      <SettingsProvider>
      <NotificationProvider>
      <TaskProvider>
        <Stack
          screenOptions={{
            contentStyle: {
              backgroundColor: theme.colors.background
            },
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="modals/task/create" 
            options={{
              presentation: 'modal',
              title: 'Create Task',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="modals/task/edit" 
            options={{
              presentation: 'modal',
              title: 'Edit Task',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen 
            name="modals/task/details" 
            options={{
              presentation: 'modal',
              title: 'Task Details',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </TaskProvider>
      </NotificationProvider>
      </SettingsProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CalendarProvider>
          <AppContent />
        </CalendarProvider>
      </ThemeProvider>
    </AuthProvider>
  );
} 