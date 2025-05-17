import React, { createContext, useContext, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useTasks } from './TaskContext';
import { useCalendar } from './CalendarContext';
import { Task } from '../types/task.types';
import { CalendarEvent } from '../types/calendar.types';
import { addMinutes, addHours, isFuture } from 'date-fns';

interface NotificationContextType {
  scheduleTaskReminder: (task: Task) => Promise<void>;
  scheduleEventReminder: (event: CalendarEvent) => Promise<void>;
  cancelTaskReminder: (taskId: string) => Promise<void>;
  cancelEventReminder: (eventId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { tasks } = useTasks();
  const { events } = useCalendar();

  useEffect(() => {
    async function configurePushNotifications() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Configure how notifications are presented when the app is in the foreground
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }

    configurePushNotifications();
  }, []);

  useEffect(() => {
    // Schedule notifications for all upcoming tasks
    tasks.forEach(task => {
      if (task.due_date && !task.completed && isFuture(new Date(task.due_date))) {
        scheduleTaskReminder(task);
      }
    });

    // Schedule notifications for all upcoming events
    events.forEach(event => {
      if (isFuture(new Date(event.start))) {
        scheduleEventReminder(event);
      }
    });
  }, [tasks, events]);

  const scheduleTaskReminder = async (task: Task) => {
    if (!task.due_date) return;

    const dueDate = new Date(task.due_date);
    
    try {
      // Cancel any existing notifications for this task
      await cancelTaskReminder(task.id);

      // Schedule notification for 1 day before
      if (isFuture(addHours(dueDate, -24))) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task Due Tomorrow',
            body: task.title,
            data: { taskId: task.id },
          },
          trigger: {
            seconds: Math.floor((addHours(dueDate, -24).getTime() - Date.now()) / 1000),
            channelId: 'default',
          },
          identifier: `task-${task.id}-24h`,
        });
      }

      // Schedule notification for 1 hour before
      if (isFuture(addHours(dueDate, -1))) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task Due in 1 Hour',
            body: task.title,
            data: { taskId: task.id },
          },
          trigger: {
            seconds: Math.floor((addHours(dueDate, -1).getTime() - Date.now()) / 1000),
            channelId: 'default',
          },
          identifier: `task-${task.id}-1h`,
        });
      }

      // Schedule notification at due time
      if (isFuture(dueDate)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task Due Now',
            body: task.title,
            data: { taskId: task.id },
          },
          trigger: {
            seconds: Math.floor((dueDate.getTime() - Date.now()) / 1000),
            channelId: 'default',
          },
          identifier: `task-${task.id}-due`,
        });
      }
    } catch (error) {
      console.error('Error scheduling task notification:', error);
    }
  };

  const scheduleEventReminder = async (event: CalendarEvent) => {
    const startDate = new Date(event.start);
    
    try {
      // Cancel any existing notifications for this event
      await cancelEventReminder(event.id);

      // Schedule notification for 1 hour before
      if (isFuture(addHours(startDate, -1))) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Event Starting in 1 Hour',
            body: event.title,
            data: { eventId: event.id },
          },
          trigger: {
            seconds: Math.floor((addHours(startDate, -1).getTime() - Date.now()) / 1000),
            channelId: 'default',
          },
          identifier: `event-${event.id}-1h`,
        });
      }

      // Schedule notification 15 minutes before
      if (isFuture(addMinutes(startDate, -15))) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Event Starting Soon',
            body: `${event.title} starts in 15 minutes`,
            data: { eventId: event.id },
          },
          trigger: {
            seconds: Math.floor((addMinutes(startDate, -15).getTime() - Date.now()) / 1000),
            channelId: 'default',
          },
          identifier: `event-${event.id}-15m`,
        });
      }

      // Schedule notification at start time
      if (isFuture(startDate)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Event Starting Now',
            body: event.title,
            data: { eventId: event.id },
          },
          trigger: {
            seconds: Math.floor((startDate.getTime() - Date.now()) / 1000),
            channelId: 'default',
          },
          identifier: `event-${event.id}-start`,
        });
      }
    } catch (error) {
      console.error('Error scheduling event notification:', error);
    }
  };

  const cancelTaskReminder = async (taskId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(`task-${taskId}-24h`);
      await Notifications.cancelScheduledNotificationAsync(`task-${taskId}-1h`);
      await Notifications.cancelScheduledNotificationAsync(`task-${taskId}-due`);
    } catch (error) {
      console.error('Error canceling task notifications:', error);
    }
  };

  const cancelEventReminder = async (eventId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(`event-${eventId}-1h`);
      await Notifications.cancelScheduledNotificationAsync(`event-${eventId}-15m`);
      await Notifications.cancelScheduledNotificationAsync(`event-${eventId}-start`);
    } catch (error) {
      console.error('Error canceling event notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      scheduleTaskReminder, 
      scheduleEventReminder, 
      cancelTaskReminder, 
      cancelEventReminder 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 