import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheming } from '../../src/hooks/useTheming';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  const { styles: themeStyles, theme } = useTheming();

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);
      await signUp({ email, password, full_name: fullName });
      router.replace('/(auth)/login');
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
          Create Account
        </Text>
        <Text variant="titleMedium" style={{ color: theme.colors.secondary }}>
          Join FUSION
        </Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <Text style={{ color: theme.colors.error, marginBottom: 10 }}>
            {error}
          </Text>
        ) : null}

        <TextInput
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
        />

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
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Create Account
        </Button>

        <View style={styles.footer}>
          <Text>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Button mode="text" compact>
              Login
            </Button>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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