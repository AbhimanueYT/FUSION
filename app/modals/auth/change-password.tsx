import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAppTheme } from '../../../src/contexts/ThemeContext';
import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { router } from 'expo-router';

export default function ChangePasswordScreen() {
  const { theme } = useAppTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      router.back();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
        Change Password
      </Text>

      <TextInput
        label="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
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
        onPress={handleSubmit}
        loading={loading}
        disabled={!password || !confirmPassword || loading}
        style={styles.button}
      >
        Update Password
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
  error: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 