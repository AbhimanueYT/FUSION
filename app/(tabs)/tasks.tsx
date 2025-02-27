import { View, StyleSheet } from 'react-native';
import { FAB, Searchbar, SegmentedButtons, Menu, IconButton } from 'react-native-paper';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useTasks } from '../../src/contexts/TaskContext';
import { TaskList } from '../../src/components/TaskList';
import { useState, useMemo } from 'react';
import { useSettings } from '../../src/contexts/SettingsContext';
import { router } from 'expo-router';

type SortOption = 'dueDate' | 'priority' | 'created' | 'title';

export default function TasksScreen() {
  const { theme } = useAppTheme();
  const { tasks, toggleTaskComplete } = useTasks();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [menuVisible, setMenuVisible] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Search filter
        if (searchQuery) {
          return task.title.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .filter(task => {
        // Status filter
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
      })
      .filter(task => {
        // Settings filter
        if (!settings.showCompletedTasks) return !task.completed;
        return true;
      })
      .sort((a, b) => {
        // Sort tasks
        switch (sortBy) {
          case 'dueDate':
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          case 'created':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [tasks, searchQuery, filter, settings.showCompletedTasks, sortBy]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

      <TaskList 
        tasks={filteredTasks}
        onToggleComplete={(task) => toggleTaskComplete(task.id)}
      />

      <FAB
        icon="plus"
        onPress={() => router.push('/modals/task/create')}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 