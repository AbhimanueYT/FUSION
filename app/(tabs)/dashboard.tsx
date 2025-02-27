import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ProgressBar, FAB } from 'react-native-paper';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useTasks } from '../../src/contexts/TaskContext';
import { TaskStatsWidget } from '../../src/components/TaskStatsWidget';
import { useMemo } from 'react';
import { Task } from '../../src/types/task.types';
import { format, isToday, isThisWeek } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { theme } = useAppTheme();
  const { tasks, loading } = useTasks();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const dueToday = tasks.filter(t => t.due_date && isToday(new Date(t.due_date))).length;
    const dueThisWeek = tasks.filter(t => t.due_date && isThisWeek(new Date(t.due_date))).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;

    return {
      total,
      completed,
      completion: total ? completed / total : 0,
      dueToday,
      dueThisWeek,
      highPriority,
    };
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [tasks]);

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
                <Text 
                  variant="bodyLarge"
                  style={[
                    task.completed && styles.completedTask,
                    { color: theme.colors.onSurface }
                  ]}
                >
                  {task.title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Added {format(new Date(task.created_at), 'PP')}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon={props => <MaterialCommunityIcons name="chat" size={24} color="white" />}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={() => router.push('/chat')}
      />
    </View>
  );
}

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
});