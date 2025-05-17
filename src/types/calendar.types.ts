export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  isOverdue?: boolean;
  // Add other event properties as needed
} 