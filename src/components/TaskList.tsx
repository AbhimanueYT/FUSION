import { View, StyleSheet } from 'react-native';
import { List, IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '../contexts/ThemeContext';
import { Task } from '../types/task.types';
import { format } from 'date-fns';
import { router } from 'expo-router';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete?: (task: Task) => void;
  showDate?: boolean;
}

export function TaskList({ tasks, onToggleComplete, showDate = true }: TaskListProps) {
  const { theme } = useAppTheme();

  const handlePress = (task: Task) => {
    router.push({
      pathname: '/modals/task/details',
      params: { id: task.id }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  if (tasks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          No tasks found
        </Text>
      </View>
    );
  }

  return (
    <List.Section>
      {tasks.map(task => (
        <List.Item
          key={task.id}
          title={task.title}
          description={showDate && task.due_date ? format(new Date(task.due_date), 'PPP') : undefined}
          onPress={() => handlePress(task)}
          left={props => (
            <IconButton
              {...props}
              icon={task.completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
              onPress={() => onToggleComplete?.(task)}
              iconColor={task.completed ? theme.colors.primary : theme.colors.onSurface}
            />
          )}
          right={props => (
            <View style={styles.rightContent}>
              {task.priority && (
                <View 
                  style={[
                    styles.priorityDot, 
                    { backgroundColor: getPriorityColor(task.priority) }
                  ]} 
                />
              )}
              <List.Icon {...props} icon="chevron-right" />
            </View>
          )}
          titleStyle={[
            task.completed && styles.completedText,
            { color: theme.colors.onSurface }
          ]}
          descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
        />
      ))}
    </List.Section>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 16,
    alignItems: 'center',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
}); 