import { CalendarProvider } from 'react-native-calendars';

function SettingsScreen() {
  return (
    <CalendarProvider date={new Date().toISOString()}>
      {/* Your existing SettingsScreen content */}
    </CalendarProvider>
  );
}

export default SettingsScreen; 