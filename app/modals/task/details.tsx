import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, IconButton, Chip } from 'react-native-paper';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import { useTasks } from '../../../src/contexts/TaskContext';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function TaskDetailsScreen() {
  const { theme } = useAppTheme();
  const { tasks, updateTask, deleteTask } = useTasks();
  const { id } = useLocalSearchParams();
  const task = tasks.find(t => t.id === id);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    task?.due_date ? new Date(task.due_date) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState(task?.priority || 'medium');

  useEffect(() => {
    if (!task) {
      router.back();
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    
    await updateTask(task.id, {
      title,
      description,
      due_date: dueDate?.toISOString(),
      priority,
    });
    router.back();
  };

  const handleDelete = async () => {
    if (!task) return;
    await deleteTask(task.id);
    router.back();
  };

  if (!task) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => router.back()}
        />
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          onPress={handleDelete}
        />
      </View>

      <View style={styles.form}>
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

        <View style={styles.dateRow}>
          <Text variant="bodyLarge">Due Date:</Text>
          <Button
            onPress={() => setShowDatePicker(true)}
            mode="outlined"
          >
            {dueDate ? format(dueDate, 'PPP') : 'Set Due Date'}
          </Button>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setDueDate(date);
            }}
          />
        )}

        <View style={styles.priorityRow}>
          <Text variant="bodyLarge">Priority:</Text>
          <View style={styles.chips}>
            <Chip
              selected={priority === 'low'}
              onPress={() => setPriority('low')}
              style={priority === 'low' ? { backgroundColor: theme.colors.primaryContainer } : undefined}
            >
              Low
            </Chip>
            <Chip
              selected={priority === 'medium'}
              onPress={() => setPriority('medium')}
              style={priority === 'medium' ? { backgroundColor: theme.colors.secondaryContainer } : undefined}
            >
              Medium
            </Chip>
            <Chip
              selected={priority === 'high'}
              onPress={() => setPriority('high')}
              style={priority === 'high' ? { backgroundColor: theme.colors.errorContainer } : undefined}
            >
              High
            </Chip>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priorityRow: {
    marginBottom: 16,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    marginTop: 16,
  },
}); 