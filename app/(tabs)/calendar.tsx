import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useTasks } from '../../src/contexts/TaskContext';
import { useCalendar } from '@/contexts/CalendarContext';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { useState, useMemo } from 'react';
import { Task } from '../../src/types/task.types';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export default function CalendarScreen() {
  const { theme } = useAppTheme();
  const { tasks, loading: tasksLoading, toggleTaskComplete } = useTasks();
  const { events } = useCalendar();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const router = useRouter();

  const markedDates = useMemo(() => {
    const dates: { [key: string]: { marked: boolean; dots: Array<{color: string}> } } = {};
    
    // Mark tasks
    tasks.forEach((task: Task) => {
      if (task.due_date) {
        const date = format(new Date(task.due_date), 'yyyy-MM-dd');
        if (!dates[date]) {
          dates[date] = { marked: true, dots: [] };
        }
        dates[date].dots.push({
          color: task.completed ? theme.colors.success : theme.colors.primary
        });
      }
    });

    // Mark events
    events.forEach((event) => {
      const date = format(new Date(event.start), 'yyyy-MM-dd');
      if (!dates[date]) {
        dates[date] = { marked: true, dots: [] };
      }
      dates[date].dots.push({
        color: theme.colors.secondary
      });
    });

    return dates;
  }, [tasks, events, theme]);

  const selectedItems = useMemo(() => {
    const now = new Date();

    // Get tasks for selected date
    const dayTasks = tasks.filter((task: Task) => {
      if (!task.due_date) return false;
      return format(new Date(task.due_date), 'yyyy-MM-dd') === selectedDate;
    }).map(task => ({
      ...task,
      isOverdue: !task.completed && new Date(task.due_date!) < now
    }));

    // Get events for selected date
    const dayEvents = events.filter((event) => {
      return format(new Date(event.start), 'yyyy-MM-dd') === selectedDate;
    }).map(event => ({
      ...event,
      isOverdue: new Date(event.end) < now
    }));

    return { tasks: dayTasks, events: dayEvents };
  }, [tasks, events, selectedDate]);

  if (tasksLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <RNCalendar
        theme={{
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.onSurface,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.onSurfaceDisabled,
          monthTextColor: theme.colors.onSurface,
          arrowColor: theme.colors.primary,
        }}
        markingType="multi-dot"
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...(markedDates[selectedDate] || { dots: [] }),
            selected: true,
          },
        }}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
      />

      <View style={styles.taskList}>
        <Text 
          variant="titleMedium" 
          style={[styles.dateHeader, { color: theme.colors.onBackground }]}
        >
          {format(new Date(selectedDate), 'PPP')}
        </Text>

        {selectedItems.tasks.length === 0 && selectedItems.events.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No tasks or events on this date
          </Text>
        ) : (
          <>
            {selectedItems.tasks.length > 0 && (
              <>
                <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                  Tasks
                </Text>
                {selectedItems.tasks.map((task) => (
                  <Card 
                    key={task.id} 
                    style={[
                      styles.itemCard, 
                      { 
                        backgroundColor: task.isOverdue ? theme.colors.errorContainer : theme.colors.surface 
                      }
                    ]}
                    onPress={() => router.push(`/modals/task/details?id=${task.id}`)}
                  >
                    <Card.Content style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <Text 
                          variant="titleMedium" 
                          style={[
                            task.completed && styles.completedTask,
                            { color: task.isOverdue ? theme.colors.error : theme.colors.onSurface }
                          ]}
                        >
                          {task.title}
                        </Text>
                        <Text 
                          variant="bodySmall" 
                          style={{ 
                            color: task.isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant 
                          }}
                        >
                          {task.isOverdue ? 'Overdue' : 'Due'}: {format(new Date(task.due_date!), 'PPp')}
                        </Text>
                      </View>
                      <IconButton 
                        icon={task.completed ? "check-circle" : "circle-outline"}
                        iconColor={task.isOverdue ? theme.colors.error : (task.completed ? theme.colors.success : theme.colors.outline)}
                        size={20}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleTaskComplete(task.id);
                        }}
                      />
                    </Card.Content>
                  </Card>
                ))}
              </>
            )}

            {selectedItems.events.length > 0 && (
              <>
                <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
                  Events
                </Text>
                {selectedItems.events.map((event) => (
                  <Card 
                    key={event.id} 
                    style={[
                      styles.itemCard, 
                      { 
                        backgroundColor: event.isOverdue ? theme.colors.errorContainer : theme.colors.surface 
                      }
                    ]}
                    onPress={() => router.push(`/modals/event/details?id=${event.id}`)}
                  >
                    <Card.Content>
                      <Text 
                        variant="titleMedium" 
                        style={{ 
                          color: event.isOverdue ? theme.colors.error : theme.colors.onSurface 
                        }}
                      >
                        {event.title}
                      </Text>
                      <Text 
                        variant="bodySmall" 
                        style={{ 
                          color: event.isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant 
                        }}
                      >
                        {event.isOverdue ? 'Ended: ' : ''}{format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskList: {
    flex: 1,
    padding: 16,
  },
  dateHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  itemCard: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
}); 