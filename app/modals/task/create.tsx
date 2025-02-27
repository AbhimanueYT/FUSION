import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import { useTasks } from '../../../src/contexts/TaskContext';
import { useSettings } from '../../../src/contexts/SettingsContext';
import { router } from 'expo-router';
import { useCalendar } from '../../../src/contexts/CalendarContext';

type Priority = 'low' | 'medium' | 'high';

export default function CreateTaskScreen() {
  const { theme } = useAppTheme();
  const { createTask } = useTasks();
  const { syncTask, isLinked } = useCalendar();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');

  const handleCreate = async () => {
    if (!title.trim()) return;

    const task = await createTask({
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate?.toISOString(),
      priority,
    });

    if (isLinked && task) {
      await syncTask(task);
    }

    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleLarge" style={styles.title}>Create New Task</Text>

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
        numberOfLines={3}
        style={styles.input}
      />

      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.input}
      >
        {dueDate ? dueDate.toLocaleDateString() : 'Set Due Date'}
      </Button>

      {showDatePicker && (
        <DateTimePicker
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

      <SegmentedButtons
        value={priority}
        onValueChange={(value) => setPriority(value as Priority)}
        buttons={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
        style={styles.priority}
      />

      <Button
        mode="contained"
        onPress={handleCreate}
        disabled={!title.trim()}
        style={styles.button}
      >
        Create Task
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  priority: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
}); 