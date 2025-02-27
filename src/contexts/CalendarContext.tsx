import React, { createContext, useContext, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Task } from '../types/task.types';

WebBrowser.maybeCompleteAuthSession();

interface CalendarContextType {
  isLinked: boolean;
  linkCalendar: () => Promise<void>;
  clearAuth: () => void;
  syncTask?: (task: Task) => Promise<void>;
  removeTask?: (task: Task) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [isLinked, setIsLinked] = useState(false);

  const [_, response, promptAsync] = Google.useAuthRequest({
    clientId: '594011395295-j9ipa65l5de3ng4joblbphp50n17e4sr.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const linkCalendar = async () => {
    try {
      await promptAsync();
      if (response?.type === 'success') {
        setIsLinked(true);
      }
    } catch (error) {
      console.error('Error linking calendar:', error);
    }
  };

  const clearAuth = () => {
    setIsLinked(false);
  };

  const syncTask = async (task: Task) => {
    if (!response?.type || response.type !== 'success') return;
    const { access_token } = response.params;

    try {
      const event = {
        summary: task.title,
        description: task.description,
        start: {
          dateTime: task.due_date,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: task.due_date,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Error syncing task:', error);
    }
  };

  const removeTask = async (task: Task) => {
    if (!response?.type || response.type !== 'success') return;
    const { access_token } = response.params;

    try {
      // Implement task removal from calendar
    } catch (error) {
      console.error('Error removing task:', error);
    }
  };

  return (
    <CalendarContext.Provider value={{ 
      isLinked, 
      linkCalendar, 
      clearAuth,
      syncTask,
      removeTask 
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
} 