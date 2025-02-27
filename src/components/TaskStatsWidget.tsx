import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useAppTheme } from '../contexts/ThemeContext';

interface TaskStatsWidgetProps {
  title: string;
  value: number | string;
  backgroundColor?: string;
  textColor?: string;
}

export function TaskStatsWidget({ 
  title, 
  value, 
  backgroundColor, 
  textColor 
}: TaskStatsWidgetProps) {
  const { theme } = useAppTheme();

  return (
    <Card 
      style={[
        styles.card, 
        { backgroundColor: backgroundColor || theme.colors.surface }
      ]}
    >
      <Card.Content>
        <Text 
          variant="headlineMedium" 
          style={{ color: textColor || theme.colors.onSurface }}
        >
          {value}
        </Text>
        <Text 
          variant="bodyMedium" 
          style={{ color: textColor || theme.colors.onSurface }}
        >
          {title}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
  },
}); 