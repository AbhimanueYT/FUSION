import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/contexts/AuthContext';
import { router } from 'expo-router';

export default function DeleteAccountScreen() {
  const { theme } = useAppTheme();
  const { user, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');

      // First verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password,
      });

      if (signInError) throw new Error('Invalid password');

      // Delete user data
      if (user) {
        // Delete tasks
        await supabase
          .from('tasks')
          .delete()
          .eq('user_id', user.id);

        // Delete settings
        await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', user.id);

        // Delete avatar
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}.jpg`]);

        // Mark account for deletion
        const { error: deleteError } = await supabase.auth.updateUser({
          data: { deleted: true }
        });

        if (deleteError) throw deleteError;

        await signOut();
        router.replace('/(auth)/login');
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleLarge" style={[styles.title, { color: theme.colors.error }]}>
        Delete Account
      </Text>

      <Text 
        variant="bodyLarge" 
        style={[styles.warning, { color: theme.colors.onBackground }]}
      >
        This action cannot be undone. All your data will be permanently deleted.
      </Text>

      <TextInput
        label="Confirm Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {error ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}

      <Button
        mode="contained"
        onPress={handleDelete}
        loading={loading}
        disabled={!password || loading}
        buttonColor={theme.colors.error}
        style={styles.button}
      >
        Delete My Account
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
  warning: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  error: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 