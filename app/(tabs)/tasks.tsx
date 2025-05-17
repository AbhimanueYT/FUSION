import React from 'react';
import { View, StyleSheet, ScrollView, FlatList, Pressable } from 'react-native';
import { FAB, Searchbar, SegmentedButtons, Menu, IconButton, Checkbox, Text } from 'react-native-paper';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useTasks } from '../../src/contexts/TaskContext';
import { TaskList } from '../../src/components/TaskList';
import { useState, useMemo } from 'react';
import { useSettings } from '../../src/contexts/SettingsContext';
import { router } from 'expo-router';
import { useCalendar } from '@/contexts/CalendarContext';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Task } from '../../src/types/task.types';
import { CalendarEvent } from '../../src/types/calendar.types';

type SortOption = 'dueDate' | 'priority' | 'created' | 'title';

export default function TasksScreen() {
  const { theme } = useAppTheme();
  const { tasks, toggleTaskComplete } = useTasks();
  const { settings } = useSettings();
  const { events } = useCalendar();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      padding: 16,
      gap: 16,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchBar: {
      flex: 1,
      elevation: 0,
    },
    filterButtons: {
      marginBottom: 8,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      elevation: 5,
    },
    itemContainer: {
      padding: 12,
      marginVertical: 4,
      borderRadius: 8,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      marginBottom: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
    },
    taskContent: {
      flex: 1,
      marginLeft: 16,
    },
    taskText: {
      color: theme.colors.onSurface,
    },
    completedText: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    dueDate: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 24,
      color: theme.colors.onSurfaceVariant,
    },
    listContent: {
      padding: 16,
    },
  }), [theme]);

  const combinedItems = useMemo(() => {
    const now = new Date();

    // Filter tasks based on selected filter
    const filteredTasks = tasks.filter(task => {
      if (filter === 'active') return !task.completed
      if (filter === 'completed') return task.completed
      return true // 'all' filter
    }).map(task => ({
      ...task,
      type: 'task' as const,
      isOverdue: !task.completed && task.due_date && new Date(task.due_date) < now
    }));

    // Get events
    const mappedEvents = events.map(e => ({ 
      ...e, 
      type: 'event' as const,
      isOverdue: new Date(e.end) < now
    }));

    // Combine items
    const items = [
      ...filteredTasks,
      ...mappedEvents
    ];

    // Search filter
    const searchedItems = items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sorting logic
    return searchedItems.sort((a, b) => {
      // Tasks and events have different date properties
      const aDate = a.type === 'task' ? a.due_date || a.created_at : a.start;
      const bDate = b.type === 'task' ? b.due_date || b.created_at : b.start;

      // Common sorting logic
      switch(sortBy) {
        case 'dueDate':
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        case 'priority':
          if (a.type === 'task' && b.type === 'task') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return 0;
        case 'created':
          if (a.type === 'task' && b.type === 'task') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          return 0;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [tasks, events, filter, sortBy, searchQuery]);

  const TaskItem = ({ item }: { item: Task | CalendarEvent }) => (
    <Pressable
      onPress={() => {
        if ('due_date' in item) {
          router.push(`/modals/task/details?id=${item.id}`);
        } else {
          router.push(`/modals/event/details?id=${item.id}`);
        }
      }}
      style={({ pressed }) => [
        styles.taskItem,
        { 
          opacity: pressed ? 0.6 : 1,
          backgroundColor: item.isOverdue ? 
            theme.colors.errorContainer : 
            theme.colors.surfaceVariant 
        }
      ]}
    >
      {'due_date' in item && (
        <>
          <Checkbox.Android
            status={item.completed ? 'checked' : 'unchecked'}
            onPress={(e) => {
              e.stopPropagation();
              toggleTaskComplete(item.id);
            }}
            color={item.isOverdue ? theme.colors.error : theme.colors.primary}
            uncheckedColor={item.isOverdue ? theme.colors.error : theme.colors.outline}
          />
          {'priority' in item && (
            <IconButton
              icon="flag"
              size={16}
              iconColor={
                item.isOverdue ? theme.colors.error :
                item.priority === 'high' ? theme.colors.error :
                item.priority === 'medium' ? theme.colors.warning :
                theme.colors.success
              }
              style={{ marginRight: -8 }}
            />
          )}
        </>
      )}
      <View style={styles.taskContent}>
        <Text 
          variant="bodyLarge" 
          style={[
            styles.taskText,
            ('completed' in item && item.completed) && styles.completedText,
            { color: item.isOverdue ? theme.colors.error : theme.colors.onSurface }
          ]}
        >
          {item.title}
        </Text>
        {'due_date' in item && item.due_date && (
          <Text 
            variant="bodySmall" 
            style={[
              styles.dueDate,
              { color: item.isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant }
            ]}
          >
            {item.isOverdue ? 'Overdue - ' : ''}{format(new Date(item.due_date), 'MMM dd, yyyy • hh:mm a')}
          </Text>
        )}
      </View>
      <IconButton
        icon="chevron-right"
        size={20}
        iconColor={item.isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant}
        onPress={() => {
          if ('due_date' in item) {
            router.push(`/modals/task/details?id=${item.id}`);
          } else {
            router.push(`/modals/event/details?id=${item.id}`);
          }
        }}
      />
    </Pressable>
  );

  if (!theme) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <Searchbar
              placeholder="Search tasks"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="sort"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item 
                onPress={() => { setSortBy('dueDate'); setMenuVisible(false); }}
                title="Sort by due date"
                leadingIcon="calendar"
              />
              <Menu.Item 
                onPress={() => { setSortBy('priority'); setMenuVisible(false); }}
                title="Sort by priority"
                leadingIcon="flag"
              />
              <Menu.Item 
                onPress={() => { setSortBy('created'); setMenuVisible(false); }}
                title="Sort by created date"
                leadingIcon="clock"
              />
              <Menu.Item 
                onPress={() => { setSortBy('title'); setMenuVisible(false); }}
                title="Sort by title"
                leadingIcon="sort-alphabetical-ascending"
              />
            </Menu>
          </View>
          <SegmentedButtons
            value={filter}
            onValueChange={setFilter}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
            ]}
            style={styles.filterButtons}
          />
        </View>

        <FlatList
          data={combinedItems}
          renderItem={({ item }) => <TaskItem item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks found</Text>
          }
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB
        icon="plus"
        onPress={() => router.push('/modals/task/create')}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
      />
    </View>
  );
} 