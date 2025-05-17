import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { List, Switch, Button, Divider, Text, Card } from 'react-native-paper';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { useCalendar } from '@/contexts/CalendarContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NotificationService } from '@/services/NotificationService';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDarkMode } = useAppTheme();
  const { settings, updateSettings } = useSettings();
  const { signOut } = useAuth();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { isLinked, linkCalendar, clearAuth } = useCalendar();

  // Convert minutes to Date object for the time picker
  const reminderTime = new Date();
  if (settings.reminderTime) {
    const minutes = parseInt(settings.reminderTime);
    reminderTime.setHours(Math.floor(minutes / 60));
    reminderTime.setMinutes(minutes % 60);
  }

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Convert time back to minutes
      const minutes = (selectedTime.getHours() * 60) + selectedTime.getMinutes();
      updateSettings({
        reminderTime: minutes.toString()
      });
    }
  };

  // Platform-specific time picker
  const showPicker = () => {
    if (Platform.OS === 'ios') {
      setShowTimePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Appearance</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Dark Mode"
            description="Toggle between light and dark theme"
            left={props => (
              <MaterialCommunityIcons
                {...props}
                name={isDarkMode ? "weather-night" : "weather-sunny"}
                size={24}
                color={theme.colors.primary}
              />
            )}
            right={props => (
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Notifications</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Enable Notifications"
            description="Get reminders for upcoming tasks and events"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => (
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={value =>
                  updateSettings({ notificationsEnabled: value })
                }
              />
            )}
          />

          {settings.notificationsEnabled && (
            <>
              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.subsectionTitle}>Reminder Time</Text>
              <Text variant="bodyMedium" style={styles.description}>
                How long before the scheduled time should we remind you?
              </Text>
              
              <View style={styles.reminderButtons}>
                {[
                  { label: 'At time', value: '0' },
                  { label: '5 minutes', value: '5' },
                  { label: '15 minutes', value: '15' },
                  { label: '30 minutes', value: '30' },
                  { label: '1 hour', value: '60' },
                  { label: '1 day', value: '1440' }
                ].map(option => (
                  <Button
                    key={option.value}
                    mode={settings.reminderTime === option.value ? "contained" : "outlined"}
                    onPress={() => updateSettings({ reminderTime: option.value })}
                    style={styles.reminderButton}
                    labelStyle={styles.reminderButtonLabel}
                  >
                    {option.label}
                  </Button>
                ))}
              </View>
              
              <Button
                mode="outlined"
                onPress={async () => {
                  const notifications = await NotificationService.getScheduledNotifications();
                  Alert.alert(
                    'Scheduled Notifications',
                    `You have ${notifications.length} scheduled notifications.`,
                    [
                      {
                        text: 'Cancel All',
                        onPress: () => NotificationService.cancelAllNotifications(),
                        style: 'destructive',
                      },
                      { text: 'OK' },
                    ]
                  );
                }}
                style={{ marginTop: 16 }}
              >
                View Scheduled Notifications
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>Integrations</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Google Calendar"
            description={isLinked ? "Connected" : "Not connected"}
            left={props => (
              <MaterialCommunityIcons
                {...props}
                name="google"
                size={24}
                color={theme.colors.primary}
              />
            )}
            right={props => (
              <Button
                mode={isLinked ? "outlined" : "contained"}
                onPress={isLinked ? clearAuth : linkCalendar}
              >
                {isLinked ? "Disconnect" : "Connect"}
              </Button>
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>About</Text>
          <Divider style={styles.divider} />
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => (
              <MaterialCommunityIcons
                {...props}
                name="information-outline"
                size={24}
                color={theme.colors.primary}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Platform-specific time picker rendering */}
      {(showTimePicker || Platform.OS === 'ios') && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          onChange={handleTimeChange}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  divider: {
    marginBottom: 16,
  },
  reminderButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  reminderButton: {
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  reminderButtonLabel: {
    fontSize: 14,
  },
  subsectionTitle: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
  },
}); 