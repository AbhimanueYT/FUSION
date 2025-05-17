import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useCalendar } from '@/contexts/CalendarContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { format } from 'date-fns';
import { useRouter } from '@/hooks/useRouter';

interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  isTask?: boolean;
}

interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor?: string;
    selected?: boolean;
    events?: CalendarItem[];
  };
}

const isValidDate = (dateString: string) => {
  return !isNaN(new Date(dateString).getTime());
};

const CalendarScreen = () => {
  const isFocused = useIsFocused();
  const { theme } = useAppTheme();
  const { events, refreshEvents } = useCalendar();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isFocused) refreshEvents();
  }, [isFocused]);

  const markedDates = events.reduce((acc, event) => {
    const date = event.start.split('T')[0];
    acc[date] = { 
      marked: true, 
      dotColor: theme.colors.primary,
      events: [{
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end
      }]
    };
    return acc;
  }, {} as MarkedDates);

  const handleEventPress = (event: CalendarItem) => {
    router.push({
      pathname: '/modals/event/edit',
      params: {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description
      }
    });
  };

  const renderEventDetails = () => {
    if (!selectedDate) return null;
    
    const dateEvents = markedDates[selectedDate]?.events || [];
    
    return (
      <ScrollView style={styles.eventList}>
        <Text style={[styles.dateHeader, { color: theme.colors.onSurface }]}>
          Events on {format(new Date(selectedDate), 'PPP')}
        </Text>
        {dateEvents.map(event => (
          <View 
            key={event.id}
            style={[styles.eventItem, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Text style={[styles.eventTitle, { color: theme.colors.onSurface }]}>
              {event.title}
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {isValidDate(event.start) && isValidDate(event.end) 
                ? `${format(new Date(event.start), 'p')} - ${format(new Date(event.end), 'p')}`
                : 'All day event'}
            </Text>
            {event.description && (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {event.description}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Calendar
        markedDates={markedDates}
        theme={{
          calendarBackground: theme.colors.background,
          dayTextColor: theme.colors.text,
          todayTextColor: theme.colors.primary,
        }}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        onEventPress={handleEventPress}
      />
      {renderEventDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventList: {
    padding: 15,
    maxHeight: '50%',
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventItem: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 14,
    marginTop: 4,
  },
  eventDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
});

export default CalendarScreen; 