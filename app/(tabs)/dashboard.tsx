import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, ProgressBar, FAB, Text, Checkbox } from 'react-native-paper';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useTasks } from '../../src/contexts/TaskContext';
import { TaskStatsWidget } from '../../src/components/TaskStatsWidget';
import { useMemo } from 'react';
import { Task } from '../../src/types/task.types';
import { format, isToday, isThisWeek } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCalendar } from '@/contexts/CalendarContext';

export default function DashboardScreen() {
  const { theme } = useAppTheme();
  const { tasks, loading, toggleTaskComplete } = useTasks();
  const { events } = useCalendar();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const dueToday = tasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && !t.completed).length;
    const dueThisWeek = tasks.filter(t => t.due_date && isThisWeek(new Date(t.due_date)) && !t.completed).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.start) >= now).length;

    return {
      total,
      completed,
      completion: total ? completed / total : 0,
      dueToday,
      dueThisWeek,
      highPriority,
      upcomingEvents,
    };
  }, [tasks, events]);

  const upcomingItems = useMemo(() => {
    const now = new Date();
    
    // Get incomplete tasks that are due in the future
    const incompleteTasks = tasks
      .filter(task => {
        if (task.completed) return false;
        if (!task.due_date) return false;
        // Only include tasks with future due dates
        return new Date(task.due_date) > now;
      })
      .map(task => ({
        ...task,
        type: 'task' as const,
        timestamp: new Date(task.due_date!).getTime()
      }));

    // Get future events only
    const futureEvents = events
      .filter(event => new Date(event.start) > now)
      .map(event => ({
        ...event,
        type: 'event' as const,
        timestamp: new Date(event.start).getTime()
      }));

    // Combine and sort by date
    return [...incompleteTasks, ...futureEvents]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 5); // Show only next 5 items
  }, [tasks, events]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [tasks]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    card: {
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    recentTask: {
      marginBottom: 12,
    },
    completedTask: {
      textDecorationLine: 'line-through',
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    eventItem: {
      padding: 12,
      marginVertical: 4,
      borderRadius: 8,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '500',
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    taskText: {
      marginLeft: 8,
    },
    completedText: {
      textDecorationLine: 'line-through',
    },
  });

  const TaskItem = ({ task }: { task: Task }) => {
    return (
      <View style={styles.taskItem}>
        <Checkbox
          status={task.completed ? 'checked' : 'unchecked'}
          onPress={() => toggleTaskComplete(task.id)}
          color={theme.colors.primary}
        />
        <Text style={[styles.taskText, task.completed && styles.completedText]}>
          {task.title}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Overall Progress
            </Text>
            <View style={styles.statsRow}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {stats.completed} of {stats.total} tasks completed
              </Text>
              <Text style={{ color: theme.colors.primary }}>
                {Math.round(stats.completion * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={stats.completion}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        <View style={styles.row}>
          <TaskStatsWidget
            title="Due Today"
            value={stats.dueToday}
            backgroundColor={theme.colors.primaryContainer}
            textColor={theme.colors.onPrimaryContainer}
          />
          <TaskStatsWidget
            title="Due This Week"
            value={stats.dueThisWeek}
            backgroundColor={theme.colors.secondaryContainer}
            textColor={theme.colors.onSecondaryContainer}
          />
        </View>

        <TaskStatsWidget
          title="High Priority Tasks"
          value={stats.highPriority}
          backgroundColor={theme.colors.errorContainer}
          textColor={theme.colors.onErrorContainer}
        />

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text 
              variant="titleMedium" 
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Recently Added
            </Text>
            {recentTasks.map((task: Task) => (
              <View key={task.id} style={styles.recentTask}>
                <TaskItem task={task} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Added {format(new Date(task.created_at), 'PP')}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Upcoming Items ({upcomingItems.length})
            </Text>
            {upcomingItems.length === 0 ? (
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                No upcoming tasks or events
              </Text>
            ) : (
              upcomingItems.map(item => (
                <View 
                  key={item.id} 
                  style={styles.recentTask}
                >
                  <View style={styles.taskItem}>
                    {item.type === 'task' ? (
                      <Checkbox
                        status={'unchecked'}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleTaskComplete(item.id);
                        }}
                        color={theme.colors.primary}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="calendar"
                        size={24}
                        color={theme.colors.secondary}
                        style={{ marginLeft: 6, marginRight: 2 }}
                      />
                    )}
                    <Text 
                      style={[
                        styles.taskText, 
                        { color: theme.colors.onSurface }
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Text 
                    variant="bodySmall" 
                    style={{ 
                      color: theme.colors.onSurfaceVariant,
                      marginLeft: item.type === 'task' ? 40 : 38
                    }}
                  >
                    {item.type === 'task' ? 
                      `Due ${format(new Date(item.due_date!), 'PPp')}` :
                      `${format(new Date(item.start), 'PPp')} - ${format(new Date(item.end), 'p')}`
                    }
                  </Text>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon={props => <MaterialCommunityIcons name="chat" size={24} color="white" />}
        onPress={() => router.push('/chat')}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
      />
    </View>
  );
}