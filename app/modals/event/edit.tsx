import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCalendar } from '../../../src/contexts/CalendarContext';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';

export default function EditEventModal() {
  const { theme } = useAppTheme();
  const { updateEvent } = useCalendar();
  const params = useLocalSearchParams();

  const [title, setTitle] = useState(params.title?.toString() || '');
  const [description, setDescription] = useState(params.description?.toString() || '');
  const [start, setStart] = useState(new Date(params.start?.toString() || Date.now()));
  const [end, setEnd] = useState(new Date(params.end?.toString() || Date.now()));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleUpdate = async () => {
    try {
      await updateEvent(params.id as string, {
        title,
        description,
        start: start.toISOString(),
        end: end.toISOString()
      });
      router.back();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleLarge" style={styles.title}>Edit Event</Text>
      
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
        style={styles.input}
      />
      
      <Button
        mode="outlined"
        onPress={() => setShowStartPicker(true)}
        style={styles.input}
      >
        {`Start: ${format(start, 'PPPp')}`}
      </Button>
      
      <Button
        mode="outlined"
        onPress={() => setShowEndPicker(true)}
        style={styles.input}
      >
        {`End: ${format(end, 'PPPp')}`}
      </Button>
      
      {showStartPicker && (
        <DateTimePicker
          value={start}
          mode="datetime"
          onChange={(_, date) => {
            setShowStartPicker(false);
            date && setStart(date);
          }}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={end}
          mode="datetime"
          onChange={(_, date) => {
            setShowEndPicker(false);
            date && setEnd(date);
          }}
        />
      )}
      
      <Button
        mode="contained"
        onPress={handleUpdate}
        style={styles.button}
      >
        Update Event
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { marginBottom: 24 },
  input: { marginBottom: 16 },
  button: { marginTop: 16 }
}); 