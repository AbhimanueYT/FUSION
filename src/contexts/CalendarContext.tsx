import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task.types';
import { Platform } from 'react-native';
import { useNotifications } from './NotificationContext';

WebBrowser.maybeCompleteAuthSession();

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
}

type CalendarContextType = {
  events: CalendarEvent[];
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refreshEvents: () => Promise<void>;
  syncTask: (task: Task) => Promise<void>;
  isLinked: boolean;
};

const CalendarContext = createContext<CalendarContextType>({
  events: [],
  createEvent: async () => {},
  updateEvent: async () => {},
  deleteEvent: async () => {},
  refreshEvents: async () => {},
  syncTask: async () => {},
  isLinked: false
});

const CALENDAR_TOKEN_KEY = '@calendar_token';
const STORAGE_KEY = 'calendar_events';

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { scheduleEventReminder, cancelEventReminder } = useNotifications();
  
  const createEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = {
      ...event,
      id: Date.now().toString(),
    };
    
    try {
      setEvents(prev => {
        // Check for existing events with same title+time
        const exists = prev.some(e => 
          e.title === newEvent.title &&
          e.start === newEvent.start &&
          e.end === newEvent.end
        );
        
        if (!exists) {
          // Schedule notification for the new event
          scheduleEventReminder(newEvent);
          return [...prev, newEvent];
        }
        return prev;
      });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    if (
      (updates.start && !isValidDate(updates.start)) ||
      (updates.end && !isValidDate(updates.end))
    ) {
      throw new Error('Invalid date format');
    }

    try {
      setEvents(prev => prev.map(event => {
        if (event.id === id) {
          const updatedEvent = { ...event, ...updates };
          // Cancel old notifications and schedule new ones
          cancelEventReminder(id);
          scheduleEventReminder(updatedEvent);
          return updatedEvent;
        }
        return event;
      }));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      // Cancel notifications for the deleted event
      await cancelEventReminder(id);
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const refreshEvents = async () => {
    try {
      // Get fresh data from storage
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedEvents = saved ? JSON.parse(saved) : [];
      
      // Update state with fresh data
      setEvents(parsedEvents);
      
      // Reschedule notifications for future events
      const now = new Date();
      parsedEvents.forEach((event: CalendarEvent) => {
        if (new Date(event.start) > now) {
          scheduleEventReminder(event);
        }
      });
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  };

  useEffect(() => {
    const loadEvents = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedEvents = JSON.parse(saved);
        setEvents(parsedEvents);
        
        // Schedule notifications for future events
        const now = new Date();
        parsedEvents.forEach((event: CalendarEvent) => {
          if (new Date(event.start) > now) {
            scheduleEventReminder(event);
          }
        });
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  return (
    <CalendarContext.Provider value={{ events, createEvent, updateEvent, deleteEvent, refreshEvents, syncTask: async () => {}, isLinked: false }}>
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

const isValidDate = (dateString: string) => {
  return !isNaN(new Date(dateString).getTime());
}; 