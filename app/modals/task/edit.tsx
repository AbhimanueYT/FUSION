import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTasks } from '../../../src/contexts/TaskContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task } from '../../../src/types/task.types';

export default function EditTaskModal() {
  const { theme } = useAppTheme();
  const { tasks, updateTask } = useTasks();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date) : null);
    }
  }, [id, tasks]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateTask(id, {
        title,
        description,
        priority: priority as Task['priority'],
        due_date: dueDate?.toISOString(),
      });
      router.back();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
        Edit Task
      </Text>

      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <View style={styles.dateContainer}>
        <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onBackground }]}>
          Due Date
        </Text>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          icon="calendar"
        >
          {dueDate ? dueDate.toLocaleDateString() : 'Select Date'}
        </Button>
      </View>

      <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onBackground }]}>
        Priority
      </Text>
      <SegmentedButtons
        value={priority}
        onValueChange={setPriority}
        buttons={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' }
        ]}
        style={styles.priority}
      />

      <View style={styles.buttons}>
        <Button 
          mode="outlined" 
          onPress={() => router.back()}
          style={styles.button}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          mode="contained" 
          onPress={handleUpdate}
          style={styles.button}
          loading={loading}
          disabled={loading || !title.trim()}
        >
          Update
        </Button>
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={dueDate || new Date()}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  dateContainer: {
    marginBottom: 16,
  },
  priority: {
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
}); 