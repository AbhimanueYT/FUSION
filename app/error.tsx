import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAppTheme } from '../src/contexts/ThemeContext';
import { ErrorBoundaryProps } from 'expo-router';

export default function ErrorScreen(props: ErrorBoundaryProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text 
        variant="headlineMedium" 
        style={[styles.title, { color: theme.colors.error }]}
      >
        Oops!
      </Text>
      <Text 
        variant="bodyLarge" 
        style={[styles.message, { color: theme.colors.onBackground }]}
      >
        Something went wrong
      </Text>
      {props.error.message && (
        <Text 
          variant="bodyMedium" 
          style={[styles.details, { color: theme.colors.onSurfaceVariant }]}
        >
          {props.error.message}
        </Text>
      )}
      <Button 
        mode="contained" 
        onPress={props.retry}
        style={styles.button}
      >
        Try Again
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 16,
  },
  details: {
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
  },
}); 