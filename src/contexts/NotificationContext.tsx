import React, { createContext, useContext, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useTasks } from './TaskContext';
import { Task } from '../types/task.types';
import { addDays, isFuture } from 'date-fns';

interface NotificationContextType {
  scheduleTaskReminder: (task: Task) => Promise<void>;
  cancelTaskReminder: (taskId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { tasks } = useTasks();

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
        });
      }
    }

    configurePushNotifications();
  }, []);

  useEffect(() => {
    // Reschedule all task reminders when tasks change
    tasks.forEach(task => {
      if (task.due_date && !task.completed && isFuture(new Date(task.due_date))) {
        scheduleTaskReminder(task);
      }
    });
  }, [tasks]);

  const scheduleTaskReminder = async (task: Task) => {
    if (!task.due_date) return;

    const dueDate = new Date(task.due_date);
    const reminderDate = addDays(dueDate, -1); // Notify 1 day before

    if (!isFuture(reminderDate)) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Due Tomorrow',
        body: task.title,
        data: { taskId: task.id },
      },
      trigger: {
        channelId: 'default',
        date: reminderDate,
        repeats: false,
      }, 
      identifier: `task-${task.id}`,
    });
  };

  const cancelTaskReminder = async (taskId: string) => {
    await Notifications.cancelScheduledNotificationAsync(`task-${taskId}`);
  };

  return (
    <NotificationContext.Provider value={{ scheduleTaskReminder, cancelTaskReminder }}>
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