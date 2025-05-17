import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheming } from '../../src/hooks/useTheming';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const { styles: themeStyles, theme } = useTheming();

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await signIn({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[themeStyles.container, styles.container]}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={{ color: theme.colors.primary }}>
          FUSION
        </Text>
        <Text variant="titleMedium" style={{ color: theme.colors.secondary }}>
          Task Management
        </Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <Text style={{ color: theme.colors.error, marginBottom: 10 }}>
            {error}
          </Text>
        ) : null}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>

        <View style={styles.footer}>
          <Text>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <Button mode="text" compact>
              Sign Up
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
    paddingVertical: 6,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 