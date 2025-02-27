import { View, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useTasks } from '../../src/contexts/TaskContext';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { useState, useMemo } from 'react';
import { Task } from '../../src/types/task.types';
import { format } from 'date-fns';

export default function CalendarScreen() {
  const { theme } = useAppTheme();
  const { tasks, loading } = useTasks();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const markedDates = useMemo(() => {
    const dates: { [key: string]: { marked: boolean; dotColor: string } } = {};
    tasks.forEach((task: Task) => {
      if (task.due_date) {
        const date = format(new Date(task.due_date), 'yyyy-MM-dd');
        dates[date] = {
          marked: true,
          dotColor: task.completed ? theme.colors.primary : theme.colors.error,
        };
      }
    });
    return dates;
  }, [tasks, theme]);

  const selectedTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      if (!task.due_date) return false;
      return format(new Date(task.due_date), 'yyyy-MM-dd') === selectedDate;
    });
  }, [tasks, selectedDate]);

  if (loading) {
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
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
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
          Tasks for {format(new Date(selectedDate), 'PPP')}
        </Text>
        
        {selectedTasks.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No tasks due on this date
          </Text>
        ) : (
          selectedTasks.map((task: Task) => (
            <Card 
              key={task.id} 
              style={[styles.taskCard, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Content>
                <Text 
                  variant="titleMedium" 
                  style={[
                    task.completed && styles.completedTask,
                    { color: theme.colors.onSurface }
                  ]}
                >
                  {task.title}
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Priority: {task.priority}
                </Text>
              </Card.Content>
            </Card>
          ))
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
  taskCard: {
    marginBottom: 8,
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