import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import ChatScreen from '../../src/components/ChatScreen';

export default function ChatRoute() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ChatScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

