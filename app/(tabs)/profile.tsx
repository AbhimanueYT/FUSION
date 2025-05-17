import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, List, Button, Divider } from 'react-native-paper';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../src/lib/supabase';
import { useState, useEffect } from 'react';
import { UserWithMetadata } from '../../src/types/auth.types';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      const fullName = (user as UserWithMetadata).user_metadata?.full_name;
      if (fullName) {
        setUsername(fullName);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}.jpg`);
      
      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
      }
    }
  }, [user]);

  if (!user) return null;

const STORAGE_KEY = 'fusion_chat_history';

  //aaron
  async function handleDeleteAllData() {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete ALL your tasks, messages, and history? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            console.log('Delete All Data button pressed.');
            if (!user) {
              console.error('User is null, cannot delete data.');
              Alert.alert("Error", "User not logged in.");
              return;
            }
            try {
              console.log('Attempting to delete tasks for user:', user.id);
              // Delete all tasks for the current user
              const { error: tasksError } = await supabase
                .from('tasks')
                .delete()
                .eq('user_id', user.id); // Assuming tasks are linked by user_id

              console.log('Supabase tasks delete result - error:', tasksError);

              if (tasksError) throw tasksError;

              console.log('Tasks deleted successfully. Attempting to delete chat history.');
              // Delete chat history from AsyncStorage
              await AsyncStorage.removeItem(STORAGE_KEY);
              console.log('Chat history deleted successfully.');

              console.log('All user data (tasks, messages, history) deleted successfully.');
              Alert.alert("Success", "All your data has been deleted.");
              // Optionally, navigate the user away or refresh the screen
            } catch (error) {
              console.error('Error deleting all data:', error);
              let errorMessage = "An unknown error occurred.";
              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
                 errorMessage = (error as any).message;
              } else if (typeof error === 'string') {
                 errorMessage = error;
              }
              Alert.alert("Error", `Failed to delete data: ${errorMessage}`);
            }
          }
        }
      ]
    );
  }

  const createdAt = new Date((user as any).created_at || Date.now());
  const initials = username
    ? username.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() || '??';

  const handleAvatarPress = async () => {
    if (!user) {
      console.error('User is null, cannot upload avatar.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const fileName = `${user.id}.jpg`;
        const contentType = 'image/jpeg';
        const base64FileData = result.assets[0].base64;

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(base64FileData), {
            contentType,
            upsert: true,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Avatar.Image 
          size={80} 
          source={{ 
            uri: avatarUrl || `https://ui-avatars.com/api/?name=${initials}&background=random` 
          }}
          style={{ backgroundColor: theme.colors.primary }}
          onTouchEnd={handleAvatarPress}
        />
        <Text 
          variant="titleLarge" 
          style={[styles.username, { color: theme.colors.onBackground }]}
        >
          {username}
        </Text>
        <Text 
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {user.email}
        </Text>
        <Text 
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Member since {format(createdAt, 'MMMM yyyy')}
        </Text>
      </View>

      <Divider />

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Email"
          description={user.email}
          left={props => <List.Icon {...props} icon="email" />}
        />
        <List.Item
          title="Change Password"
          onPress={() => router.push('/modals/auth/change-password')}
          left={props => <List.Icon {...props} icon="key" />}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Data & Privacy</List.Subheader>
        <List.Item
        title="Delete Account"
        onPress={() => router.push('/modals/auth/delete-account')}
        left={props => <List.Icon {...props} icon="delete" />}
        titleStyle={{ color: theme.colors.error }}
      />
      {/* //aaron */}
      <List.Item
        title="Delete All Data"
        onPress={handleDeleteAllData}
        left={props => <List.Icon {...props} icon="database-remove" />}
        titleStyle={{ color: theme.colors.error }}
      />
      </List.Section>

      {/* //aaron */}
      <View style={styles.signOutSection}>
        <Button
          mode="outlined"
          onPress={signOut}
          style={styles.signOutButton}
        >
          Sign Out
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
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  username: {
    marginTop: 8,
  },
  signOutSection: {
    padding: 16,
    alignItems: 'center',
  },
  signOutButton: {
    minWidth: 120,
  },
}); 