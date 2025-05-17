import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, IconButton, Chip, Checkbox, SegmentedButtons, Portal, Modal } from 'react-native-paper';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import { useTasks } from '../../../src/contexts/TaskContext';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { format, isValid, parse } from 'date-fns';

export default function TaskDetailsScreen() {
  const { theme } = useAppTheme();
  const { tasks, updateTask, deleteTask, toggleTaskComplete } = useTasks();
  const { id } = useLocalSearchParams();
  const task = tasks.find(t => t.id === id);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    task?.due_date ? new Date(task.due_date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [mounted, setMounted] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dateString, setDateString] = useState(
    dueDate ? format(dueDate, 'MM/dd/yyyy') : ''
  );
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted && !task) {
      router.back();
    }
  }, [task, mounted]);

  useEffect(() => {
    if (mounted && !tasks.find(t => t.id === id)) {
      router.back();
    }
  }, [tasks, id, mounted]);

  useEffect(() => {
    const currentTask = tasks.find(t => t.id === id);
    if (currentTask) {
      setTitle(currentTask.title);
      setDescription(currentTask.description || '');
      setDueDate(currentTask.due_date ? new Date(currentTask.due_date) : null);
      setPriority(currentTask.priority);
    }
  }, [tasks, id]);

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

  const handleDateChange = (text: string) => {
    setDateString(text);
    
    // Allow incomplete input
    if (text.length < 10) {
      setDateError('');
      return;
    }

    // Parse the date
    const parsedDate = parse(text, 'MM/dd/yyyy', new Date());
    
    if (!isValid(parsedDate)) {
      setDateError('Invalid date format. Use MM/DD/YYYY');
      return;
    }

    setDateError('');
    setDueDate(parsedDate);
  };

  const formatDateString = (text: string) => {
    // Remove any non-digit characters
    const digits = text.replace(/\D/g, '');
    
    // Add slashes after month and day
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const DatePickerModal = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 11}, (_, i) => currentYear - 5 + i);
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const days = Array.from({length: 31}, (_, i) => i + 1);

    useEffect(() => {
      if (selectedYear && selectedMonth && selectedDay) {
        const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
        setDueDate(date);
        setShowDateModal(false);
      }
    }, [selectedYear, selectedMonth, selectedDay]);

    return (
      <View style={[styles.dateModal, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium" style={styles.modalTitle}>Select Date</Text>
        
        <View style={styles.dateSelectors}>
          <View style={styles.selector}>
            <Text>Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SegmentedButtons
                value={selectedYear?.toString() || ''}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
                buttons={years.map(year => ({
                  value: year.toString(),
                  label: year.toString(),
                }))}
              />
            </ScrollView>
          </View>

          <View style={styles.selector}>
            <Text>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SegmentedButtons
                value={selectedMonth?.toString() || ''}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
                buttons={months.map(month => ({
                  value: month.toString(),
                  label: month.toString(),
                }))}
              />
            </ScrollView>
          </View>

          <View style={styles.selector}>
            <Text>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <SegmentedButtons
                value={selectedDay?.toString() || ''}
                onValueChange={(value) => setSelectedDay(parseInt(value))}
                buttons={days.map(day => ({
                  value: day.toString(),
                  label: day.toString(),
                }))}
              />
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24
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
    title: {
      flex: 1,
    },
    dateModal: {
      padding: 20,
      borderRadius: 8,
    },
    modalTitle: {
      marginBottom: 16,
      textAlign: 'center',
    },
    dateSelectors: {
      flexDirection: 'column',
      gap: 16,
    },
    selector: {
      gap: 8,
    },
  });

  if (!task) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Checkbox.Android
          status={task.completed ? 'checked' : 'unchecked'}
          onPress={() => toggleTaskComplete(task.id)}
          color={theme.colors.primary}
          uncheckedColor={theme.colors.outline}
        />
        <Text 
          variant="headlineMedium" 
          style={[
            styles.title,
            task.completed && { textDecorationLine: 'line-through' }
          ]}
        >
          {task.title}
        </Text>
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

        <Portal>
          <Modal
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            contentContainerStyle={[
              styles.dateModal,
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text variant="titleMedium" style={styles.modalTitle}>Enter Date</Text>
            <TextInput
              label="Date (MM/DD/YYYY)"
              value={dateString}
              onChangeText={(text) => handleDateChange(formatDateString(text))}
              maxLength={10}
              keyboardType="numeric"
              error={!!dateError}
              style={{ marginBottom: 8 }}
            />
            {dateError ? (
              <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
                {dateError}
              </Text>
            ) : null}
            <Text variant="bodySmall" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
              Example: 05/15/2024
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowDatePicker(false)}
              disabled={!!dateError}
            >
              Done
            </Button>
          </Modal>
        </Portal>

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