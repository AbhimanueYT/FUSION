import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types/task.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from './NotificationContext';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  deleteTask: (id: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'user_id' | 'completed' | 'created_at'>) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  loading: boolean;
  refreshTasks: () => Promise<void>;
}

// Create context at the top level
const TaskContext = React.createContext<TaskContextType>({
  tasks: [],
  setTasks: () => {},
  deleteTask: async () => {},
  createTask: async () => {},
  toggleTaskComplete: async () => {},
  updateTask: async () => {},
  loading: false,
  refreshTasks: async () => {}
});

const TaskContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const { scheduleTaskReminder, cancelTaskReminder } = useNotifications();

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Cancel notifications
      await cancelTaskReminder(id);
      
      // Optimistic update
      setTasks(current => current.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'user_id' | 'completed' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...task,
          user_id: user.id,
          completed: false
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Schedule notification for the new task
      
      // Optimistic update
      if (data) {
        setTasks(current => [data as Task, ...current]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const toggleTaskComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      // Optimistic update
      setTasks(current =>
        current.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      );

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', id);

      if (error) {
        // Revert on error
        setTasks(current =>
          current.map(t => t.id === id ? { ...t, completed: task.completed } : t)
        );
        throw error;
      }

      // Handle notifications based on completion status
      if (!task.completed) {
        // Task was just completed, cancel notifications
        await cancelTaskReminder(id);
      } else if (task.due_date) {
        // Task was uncompleted, reschedule notifications
        await scheduleTaskReminder({ ...task, completed: false });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const updateTask = async (id: string, taskUpdate: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(taskUpdate)
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setTasks(current => 
        current.map(t => {
          if (t.id === id) {
            const updatedTask = { ...t, ...taskUpdate };
            // Handle notifications for the updated task
            if (updatedTask.due_date && !updatedTask.completed) {
              scheduleTaskReminder(updatedTask);
            } else {
              cancelTaskReminder(id);
            }
            return updatedTask;
          }
          return t;
        })
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update local state with fresh data
      setTasks(data || []);
      
      // Also update AsyncStorage
      await AsyncStorage.setItem('tasks', JSON.stringify(data || []));
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('tasks')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('INSERT event:', payload);
            setTasks(current => [payload.new as Task, ...current]);
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('UPDATE event:', payload);
            setTasks(current => 
              current.map(task => 
                task.id === payload.new.id ? payload.new as Task : task
              )
            );
          }
        )
        .on('postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('DELETE event:', payload);
            setTasks(current => 
              current.filter(task => task.id !== payload.old.id)
            );
          }
        );

      await channel.subscribe();
    };

    fetchTasks();
    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <TaskContext.Provider value={{
      tasks,
      setTasks,
      deleteTask,
      createTask,
      toggleTaskComplete,
      updateTask,
      loading,
      refreshTasks
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

export { TaskContext };
export default TaskContextProvider; 