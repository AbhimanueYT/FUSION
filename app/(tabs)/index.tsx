import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FAB } from 'react-native-paper';

export default function Dashboard() {
  return (
    <View style={{ flex: 1 }}>
      {/* Your existing dashboard content */}
      
      <FAB
        icon={props => <MaterialCommunityIcons name="chat" size={24} color="white" />}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={() => router.push('/chat')}
      />
    </View>
  );
} 