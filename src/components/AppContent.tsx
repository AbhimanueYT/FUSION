import { NavigationContainer } from '@react-navigation/native';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import TaskContextProvider from '@/contexts/TaskContext';
import { theme } from '@/utils/theme';
import { Slot } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

function AppContent() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <SettingsProvider>
          <NotificationProvider>
            <TaskContextProvider>
              <Slot />
            </TaskContextProvider>
          </NotificationProvider>
        </SettingsProvider>
      </NavigationContainer>
    </PaperProvider>
  );
}

export default AppContent; 