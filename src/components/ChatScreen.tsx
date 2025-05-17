import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TextInput,
  ScrollView,
  Platform,
  TouchableOpacity,
  Keyboard,
  Alert // Added Alert
} from 'react-native';
import { GiftedChat, IMessage, Bubble, Send, Composer, InputToolbar } from 'react-native-gifted-chat';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/env';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useCalendar } from '@/contexts/CalendarContext';
import { format } from 'date-fns';
import { useTasks } from '@/contexts/TaskContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '@/contexts/NotificationContext';
import * as IntentLauncher from 'expo-intent-launcher';
import { Task } from '@/types/task.types';
import { CalendarEvent } from '@/types/calendar.types';

const STORAGE_KEY = 'fusion_chat_history';

interface TaskData extends Omit<Task, 'id' | 'user_id' | 'completed' | 'created_at'> {
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
}

type TaskRouteParams = {
  [key: string]: string | undefined;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  autoCreate: string;
}

export default function ChatScreen() {
  const { theme } = useAppTheme();
  const { createEvent, updateEvent, deleteEvent, events, refreshEvents } = useCalendar();
  const { createTask, updateTask, deleteTask, tasks, refreshTasks } = useTasks();
  const { scheduleTaskReminder, cancelTaskReminder, scheduleEventReminder, cancelEventReminder } = useNotifications();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const commandSuggestions = [
    {
      command: '/create',
      description: 'Create a new occurrence (task/event)',
      icon: 'plus-circle-outline',
      options: [
        { value: 'task', label: 'Task', icon: 'checkbox-marked-circle-outline' },
        { value: 'event', label: 'Event', icon: 'calendar-plus' }
      ]
    },
    {
      command: '/update',
      description: 'Update an existing occurrence',
      icon: 'pencil',
      options: [
        { value: 'task', label: 'Task', icon: 'pencil' },
        { value: 'event', label: 'Event', icon: 'calendar-edit' }
      ]
    },
    {
      command: '/delete',
      description: 'Delete an occurrence',
      icon: 'delete',
      options: [
        { value: 'task', label: 'Task', icon: 'delete' },
        { value: 'event', label: 'Event', icon: 'calendar-remove' }
      ]
    },
    {
      command: '/list',
      description: 'List tasks by status',
      icon: 'format-list-bulleted',
      options: [
        { value: 'all', label: 'All Tasks', icon: 'format-list-bulleted-type' },
        { value: 'pending', label: 'Pending Tasks', icon: 'clock-outline' },
        { value: 'completed', label: 'Completed Tasks', icon: 'check-circle-outline' }
      ]
    }
  ];

  //Aaron: Type for speech recognition result
  type SpeechRecognitionResult = {
    resultCode: number;
    data?: any;
    extra?: {
      'android.speech.extra.RESULTS'?: string[];
      'query'?: string;
    };
  };

  //Aaron: Handle voice input
  const handleVoiceInput = async () => {
    try {
      setSpeechError(null);
      const result = await IntentLauncher.startActivityAsync(
        'android.speech.action.RECOGNIZE_SPEECH',
        {
          extra: {
            'android.speech.extra.LANGUAGE_MODEL': 'free_form',
            'android.speech.extra.PROMPT': 'Speak now...',
          }
        }
      ) as SpeechRecognitionResult;

     // console.log('Speech recognition result:', JSON.stringify(result, null, 2));
      
      let speechText = '';
      
      // First check extra for speech results
      if (result?.extra?.['android.speech.extra.RESULTS']?.length) {
        speechText = result.extra['android.speech.extra.RESULTS'][0];
      }
      // Fallback to extra.query
      else if (result?.extra?.query) {
        speechText = result.extra.query;
      }
      // Finally check data.extras as string
      else if (typeof result?.data === 'string' && result.data.includes('extras')) {
        try {
          const parsed = JSON.parse(result.data.replace('Intent', '').replace(/[{}()]/g, ''));
          if (parsed['android.speech.extra.RESULTS']) {
            speechText = parsed['android.speech.extra.RESULTS'][0];
          }
        } catch (e) {
          console.warn('Could not parse result data:', result.data);
        }
      }

      if (speechText) {
       // console.log('Recognized speech:', speechText);
        setInputText(speechText);
        inputRef.current?.focus();
        return;
      }
      
      setSpeechError('No speech recognized. Please try again.');
      console.warn('No speech text found in result:', result);
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      setSpeechError('Speech recognition not available. Please type your message instead.');
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text === '/') {
      setShowSuggestions(true);
      setSelectedCommand(null);
    } else if (!text.startsWith('/')) {
      setShowSuggestions(false);
      setSelectedCommand(null);
    }
  };

  const handleSuggestionPress = (command: string, option?: string) => {
    if (option) {
      setInputText(`${command}-${option} `);
      setShowSuggestions(false);
      setSelectedCommand(null);
    } else {
      setSelectedCommand(command);
    }
    inputRef.current?.focus();
  };

  const CommandSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <View style={[
        styles.suggestionsContainer,
        { 
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }
      ]}>
        {commandSuggestions.map((item, index) => (
          <View key={item.command}>
            <TouchableOpacity
              style={[
                styles.suggestionItem,
                { backgroundColor: theme.colors.surface },
                !selectedCommand && index < commandSuggestions.length - 1 && [
                  styles.suggestionBorder,
                  { borderBottomColor: theme.colors.outline }
                ]
              ]}
              onPress={() => handleSuggestionPress(item.command)}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={20}
                color={theme.colors.primary}
                style={styles.suggestionIcon}
              />
              <View style={styles.suggestionText}>
                <Text style={[styles.commandText, { color: theme.colors.primary }]}>
                  {item.command}
                </Text>
                <Text style={[styles.descriptionText, { color: theme.colors.onSurfaceVariant }]}>
                  {item.description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            {selectedCommand === item.command && (
              <View style={{ backgroundColor: theme.colors.surfaceVariant }}>
                {item.options.map((option, optIndex) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      optIndex < item.options.length - 1 && [
                        styles.suggestionBorder,
                        { borderBottomColor: theme.colors.outline }
                      ]
                    ]}
                    onPress={() => handleSuggestionPress(item.command, option.value)}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={20}
                      color={theme.colors.primary}
                      style={[styles.suggestionIcon, { marginLeft: 32 }]}
                    />
                    <Text style={[styles.commandText, { color: theme.colors.primary }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  //ai: Enhanced chat history loading with size limit
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          // Limit loaded messages to prevent memory issues
          setMessages(parsedMessages.slice(100));
        } else {
          // Set initial welcome message if no history exists
          const initialMessage = {
            _id: 1,
            text: 'Hello! I am FUSION, your task management assistant. How can I help you today?',
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'FUSION',
              avatar: 'https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-blank/assets/icon.png',
            },
          };
          setMessages([initialMessage]);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([initialMessage]));
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback to initial message if loading fails
        setMessages([{
          _id: 1,
          text: 'Hello! I am FUSION, your task management assistant. How can I help you today?',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'FUSION',
            avatar: 'https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-blank/assets/icon.png',
          },
        }]);
      }
    };

    loadMessages();
  }, []);

  //ai: Enhanced message saving with size limit
  useEffect(() => {
    const saveMessages = async () => {
      try {
        // Keep only last 100 messages to prevent storage bloat
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    };

    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages]);

  // Update the response processing function
  //ai: Enhanced response processing with duplicate checking
  const processAIResponse = (aiResponse: string, userMessage: string) => {
    console.log('AI response:', aiResponse);
    
    // More robust JSON extraction with multiple formats
    const jsonMatch = aiResponse.match(
      /(?:```json|"""json|```|""")\s*(\{[\s\S]*?\})\s*(?:```|""")/
    ) || aiResponse.match(/\{[\s\S]*?\}/);
    
    let jsonContent = null;
    let cleanedResponse = aiResponse;

    try {
      if (jsonMatch) {
        // Remove ALL JSON blocks from displayed message
        cleanedResponse = aiResponse
          .replace(/(```json|"""json)[\s\S]*?(```|""")/g, '')
          .replace(/[{}[\]]/g, '')
          .trim();

        // Parse and validate JSON
        jsonContent = JSON.parse(jsonMatch[1]);
        
        // Validate required action structure
        // Require title only for actions other than 'list'
        if (!jsonContent.action || (jsonContent.action !== 'list' && !jsonContent.title)) {
          throw new Error('Invalid action format');
        }

        // Process dates if present
        if (jsonContent.due_date) {
          const parsedDate = new Date(jsonContent.due_date);
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date format');
          }
          jsonContent.due_date = parsedDate.toISOString();
        }

        // For events, process start and end dates
        if (jsonContent.type === 'event') {
          if (jsonContent.start) {
            const parsedStart = new Date(jsonContent.start);
            if (isNaN(parsedStart.getTime())) {
              throw new Error('Invalid start date format');
            }
            jsonContent.start = parsedStart.toISOString();
          }
          if (jsonContent.end) {
            const parsedEnd = new Date(jsonContent.end);
            if (isNaN(parsedEnd.getTime())) {
              throw new Error('Invalid end date format');
            }
            jsonContent.end = parsedEnd.toISOString();
          }
        }
      }
    } catch (error) {
      console.error('JSON processing error:', error);
      jsonContent = null;
    }

    return { jsonContent, cleanedResponse };
  };

  //ai: Enhanced task handling with duplicate prevention
  const handleSend = useCallback(async (newMessages: IMessage[] = []) => {
    let timeoutId: NodeJS.Timeout | undefined;
    let aiResponse = '';
    const userMessageText = newMessages[0]?.text?.trim();
    
    // Validate message before processing
    if (!userMessageText) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true); // Keep loading indicator for local commands too for consistency
      setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));

      // const userMessageText = newMessages[0]?.text?.trim(); // Removed from here

      // --- Handle /list command locally ---
      if (userMessageText?.startsWith('/list-')) {
        const filter = userMessageText.split('-')[1]; // e.g., 'all', 'pending', 'completed'
        let filteredTasks: Task[] = [];
        let responseText = '';

        if (filter === 'all') {
          filteredTasks = tasks;
          responseText = `Here are all your tasks (${tasks.length}):\n`;
        } else if (filter === 'pending') {
          filteredTasks = tasks.filter(task => !task.completed);
          responseText = `Here are your pending tasks (${filteredTasks.length}):\n`;
        } else if (filter === 'completed') {
          filteredTasks = tasks.filter(task => task.completed);
          responseText = `Here are your completed tasks (${filteredTasks.length}):\n`;
        } else {
          responseText = `Invalid list filter: "${filter}". Please use /list-all, /list-pending, or /list-completed.`;
        }

        if (filteredTasks.length > 0) {
          responseText += filteredTasks.map((task, index) =>
            `${index + 1}. ${task.title} ${task.due_date ? `(Due: ${format(new Date(task.due_date), 'PP')})` : ''} [${task.completed ? 'Completed' : 'Pending'}]`
          ).join('\n');
        } else if (filter === 'all' || filter === 'pending' || filter === 'completed') {
           responseText += 'No tasks found matching this filter.';
        }

        const listResponseMessage: IMessage = {
          _id: Date.now() + Math.random(),
          text: responseText,
          createdAt: new Date(),
          user: { _id: 2, name: 'FUSION' } // AI user
        };

        setMessages(prev => GiftedChat.append(prev, [listResponseMessage]));
        setIsLoading(false);
        setInputText(''); // Clear input after command execution
        setShowSuggestions(false); // Hide suggestions
        return; // Skip API call for local command
      }
      // --- End /list command handling ---

      // Get the FULL conversation history including new message
      // Note: We need to use the state *after* setMessages has potentially updated.
      // GiftedChat.append returns the new array, but setMessages is async.
      // A better approach is to construct the history *before* calling setMessages,
      // or use the callback form of setMessages if we needed the *very* latest state.
      // For sending to API, using the state *before* adding the new message + the new message itself is correct.
      const fullHistory = [...messages, ...newMessages];
      
      // Build conversation history with clearer separation of current message and context
      const conversationHistory = [
        // System message with initial instructions and current date
        {
          role: 'system',
          content: `${API_CONFIG.SYSTEM_MESSAGE}\nCurrent date and time is: ${format(new Date(), 'PPPP p')}.`
        },
        // Previous messages (last 20) as historical context
        ...messages.slice(-API_CONFIG.MAX_CONTEXT_MESSAGES).map(msg => ({
          role: msg.user._id === 1 ? 'user' : 'assistant',
          content: msg.text
        })),
        // The current user message
        {
          role: 'user',
          content: newMessages[0]?.text
        }
      ];

      // Add these validations before the API call
      //ai: Better API key validation
      if (!API_CONFIG.OPENROUTER_API_KEY || API_CONFIG.OPENROUTER_API_KEY.includes('example')) {
        const errorMsg = 'Invalid or missing OpenRouter API key';
        console.error(errorMsg);
        setMessages(prev => GiftedChat.append(prev, [{
          _id: Date.now(),
          text: 'Configuration error: Please check API settings',
          createdAt: new Date(),
          user: { _id: 2, name: 'FUSION' }
        }]));
        setIsLoading(false);
        return;
      }

      // Check moved up before /list handling, but we still need it here for non-list messages
      if (!userMessageText) {
         setIsLoading(false); // Stop loading if message is empty after trimming
         return; // Don't proceed if message is empty
      }

      // Modify the API call with timeout and better error handling
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_CONFIG.OPENROUTER_API_KEY}`,
          "HTTP-Referer": API_CONFIG.APP_URL || "http://localhost:19000",
          "X-Title": "FUSION",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": API_CONFIG.MODEL,
          "messages": conversationHistory,
          "temperature": 0.7,
          "max_tokens": 500
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      aiResponse = data.choices[0].message.content;

      // Update the response processing logic
      const { jsonContent, cleanedResponse } = processAIResponse(aiResponse, userMessageText);

      // Process valid actions
      if (jsonContent) {
        try {
          // Update the required fields detection logic
          const requiredFields = {
            create: jsonContent.type === 'event' ? 
              ['title', 'start', 'end'] :  // Event detection
              ['title'],                   // Task detection - don't require due_date
            update: ['id', 'title'],
            delete: ['title']  // Changed from 'id' to 'title' since we'll search by title
          };

          const action = jsonContent.action as keyof typeof requiredFields;
          if (!(action in requiredFields)) {
            throw new Error(`Invalid action: ${action}`);
          }

          const fields = requiredFields[action];
          const missingFields = fields.filter(field => !jsonContent[field]);
          
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }

          // Show the AI response first
          setMessages(prev => GiftedChat.append(prev, [{
            _id: Date.now() + Math.random(),
            text: cleanedResponse,
            createdAt: new Date(),
            user: { _id: 2, name: 'FUSION' }
          }]));

          // Process validated actions
          switch(jsonContent.action) {
            case 'create':
              if (jsonContent.type === 'event') {
                const newEvent = {
                  title: jsonContent.title,
                  start: jsonContent.start,
                  end: jsonContent.end,
                  description: jsonContent.description || ''
                };
                await createEvent(newEvent);
                await scheduleEventReminder({
                  ...newEvent,
                  id: Date.now().toString() // You might want to get the actual ID from createEvent
                });
                await refreshEvents();
                break;
              }
              
              // For tasks, ensure we handle the due date properly
              let dueDate = null;
                
                // Try to get date from different possible fields
                if (jsonContent.due_date) {
                  dueDate = new Date(jsonContent.due_date);
                } else if (jsonContent.date) {
                  dueDate = new Date(jsonContent.date);
                } else if (jsonContent.start) {
                  dueDate = new Date(jsonContent.start);
                }

                //Aaron Validate the date 
                if (dueDate && !isNaN(dueDate.getTime())) {
                  dueDate = dueDate.toISOString();
                } else {
                  dueDate = null;
                }

                const taskData: TaskData = {
                  title: jsonContent.title,
                  description: jsonContent.description || '',
                  due_date: dueDate || undefined,
                  priority: jsonContent.priority || 'medium',
                };

                // Create task and schedule notification
                try {
                  await createTask(taskData);
                  // After creating the task, find it in the tasks list
                  const createdTask = tasks.find(
                    t => t.title === taskData.title &&
                    t.description === taskData.description &&
                    t.due_date === taskData.due_date
                  );
                  
                  if (createdTask && createdTask.due_date) {
                    await scheduleTaskReminder(createdTask);
                  }
                } catch (error) {
                  console.error('Error creating task:', error);
                }
              
              break;

            case 'update':
              const taskToUpdate = tasks.find(t => t.id === jsonContent.id);
              if (taskToUpdate) {
                // Cancel existing notifications before update
                await cancelTaskReminder(taskToUpdate.id);
                
                const updatedTask = {
                  ...taskToUpdate,
                  title: jsonContent.title,
                  description: jsonContent.description || '',
                  due_date: jsonContent.due_date,
                  priority: jsonContent.priority || 'medium',
                };

                await updateTask(updatedTask.id, updatedTask);
                
                // Schedule new notifications if there's a due date
                if (updatedTask.due_date) {
                  await scheduleTaskReminder(updatedTask);
                }
              }
              router.push({
                pathname: '/modals/task/edit',
                params: {
                  id: jsonContent.id,
                  title: jsonContent.title,
                  description: jsonContent.description || '',
                  due_date: jsonContent.due_date,
                  priority: jsonContent.priority || 'medium',
                  autoUpdate: 'true'
                }
              });
              break;

            case 'delete':
              try {
                let itemType = jsonContent.type || 'task';
                
                // First, confirm with the user what they want to delete
                setMessages(prev => GiftedChat.append(prev, [{
                  _id: Date.now() + Math.random(),
                  text: `Looking for ${itemType} "${jsonContent.title}" to delete...`,
                  createdAt: new Date(),
                  user: { _id: 2, name: 'FUSION' }
                }]));

                if (itemType === 'event') {
                  // Search for event by title and start/end time if provided
                  const matchingEvents = events.filter(event => {
                    const titleMatch = event.title.toLowerCase() === jsonContent.title.toLowerCase();
                    
                    // If no date is provided in the request, only match by title
                    if (!jsonContent.start && !jsonContent.date) return titleMatch;
                    
                    // Compare dates by converting both to the same format
                    const formatDateForComparison = (date: Date) => {
                      return format(date, 'yyyy-MM-dd HH:mm');
                    };
                    
                    const eventStartDate = new Date(event.start);
                    
                    // Check if the request has a specific start time or just a date
                    if (jsonContent.start) {
                      const requestStartDate = new Date(jsonContent.start);
                      return titleMatch && 
                             formatDateForComparison(eventStartDate) === formatDateForComparison(requestStartDate);
                    } else if (jsonContent.date) {
                      // If only date is provided (no time), compare just the dates
                      const requestDate = new Date(jsonContent.date);
                      return titleMatch && 
                             format(eventStartDate, 'yyyy-MM-dd') === format(requestDate, 'yyyy-MM-dd');
                    }
                    
                    return titleMatch;
                  });

                  if (matchingEvents.length === 0) {
                    const dateStr = jsonContent.start ? 
                      ` scheduled for ${format(new Date(jsonContent.start), 'PPp')}` :
                      jsonContent.date ? 
                      ` on ${format(new Date(jsonContent.date), 'PPP')}` : 
                      '';
                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: `❌ Could not find an event with title "${jsonContent.title}"${dateStr}. Please check the title and date/time and try again.`,
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                    return;
                  }

                  if (matchingEvents.length > 1) {
                    // If multiple events found, ask for more specific information
                    const eventList = matchingEvents.map(event => 
                      `- "${event.title}" on ${format(new Date(event.start), 'PPP')} at ${format(new Date(event.start), 'p')}`
                    ).join('\n');
                    
                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: `I found multiple events with the title "${jsonContent.title}":\n${eventList}\n\nPlease specify which one you want to delete by including the date and time.`,
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                    return;
                  }

                  const eventToDelete = matchingEvents[0];

                  // Confirm deletion with user
                  setMessages(prev => GiftedChat.append(prev, [{
                    _id: Date.now() + Math.random(),
                    text: `Found event "${eventToDelete.title}" scheduled for ${format(new Date(eventToDelete.start), 'PPp')} to ${format(new Date(eventToDelete.end), 'p')}. Proceeding to delete...`,
                    createdAt: new Date(),
                    user: { _id: 2, name: 'FUSION' }
                  }]));

                  try {
                    // First cancel the notifications
                    await cancelEventReminder(eventToDelete.id);
                    // Then delete the event
                    await deleteEvent(eventToDelete.id);
                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: "✅ Event deleted successfully",
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                  } catch (error: any) {
                    console.error('Error during event deletion:', error);
                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: `❌ Error deleting event: ${error?.message || 'Unknown error'}`,
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                  }
                } else {
                  // Search for task by title and due date if provided
                  const matchingTasks = tasks.filter(task => {
                    const titleMatch = task.title.toLowerCase() === jsonContent.title.toLowerCase();
                    
                    // If no due date is provided in the request, only match by title
                    if (!jsonContent.due_date) return titleMatch;
                    
                    // If task has no due date but request specifies one, it's not a match
                    if (!task.due_date) return false;
                    
                    // Compare dates by converting both to the same format (start of day)
                    const requestDate = new Date(jsonContent.due_date);
                    const taskDate = new Date(task.due_date);
                    
                    // Format both dates to YYYY-MM-DD for comparison
                    const formatDateForComparison = (date: Date) => {
                      return format(date, 'yyyy-MM-dd');
                    };
                    
                    return titleMatch && 
                           formatDateForComparison(requestDate) === formatDateForComparison(taskDate);
                  });

                  if (matchingTasks.length === 0) {
                    const dateStr = jsonContent.due_date ? 
                      ` and due date ${format(new Date(jsonContent.due_date), 'PPP')}` : 
                      '';
                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: `❌ Could not find a task with title "${jsonContent.title}"${dateStr}. Please check the title and date and try again.`,
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                    return;
                  }

                  if (matchingTasks.length > 1) {
                    // If multiple tasks found, ask for more specific information
                    const taskList = matchingTasks.map(task => 
                      `- "${task.title}" ${task.due_date ? `due on ${format(new Date(task.due_date), 'PPP')}` : '(no due date)'}`
                    ).join('\n');
                    
                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: `I found multiple tasks with the title "${jsonContent.title}":\n${taskList}\n\nPlease specify which one you want to delete by including the due date.`,
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                    return;
                  }

                  const taskToDelete = matchingTasks[0];

                  // Confirm deletion with user
                  setMessages(prev => GiftedChat.append(prev, [{
                    _id: Date.now() + Math.random(),
                    text: `I found the task "${taskToDelete.title}"${taskToDelete.due_date ? ` due on ${format(new Date(taskToDelete.due_date), 'PPP')}` : ''}. Proceeding to delete...`,
                    createdAt: new Date(),
                    user: { _id: 2, name: 'FUSION' }
                  }]));

                  try {
                    // First cancel the notifications
                    await cancelTaskReminder(taskToDelete.id);
                    // Then delete the task
                    await deleteTask(taskToDelete.id);
                    // Refresh both tasks and events to ensure UI is up to date
                    await Promise.all([refreshTasks(), refreshEvents()]);

                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: "✅ Task deleted successfully",
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                  } catch (error: any) {
                    console.error('Error during task deletion:', error);
                    setMessages(prev => GiftedChat.append(prev, [{
                      _id: Date.now() + Math.random(),
                      text: `❌ Error deleting task: ${error?.message || 'Unknown error'}`,
                      createdAt: new Date(),
                      user: { _id: 2, name: 'FUSION' }
                    }]));
                  }
                }
              } catch (error: any) {
                setMessages(prev => GiftedChat.append(prev, [{
                  _id: Date.now() + Math.random(),
                  text: `❌ Failed to delete ${jsonContent.type || 'item'}: ${error?.message || 'Unknown error'}`,
                  createdAt: new Date(),
                  user: { _id: 2, name: 'FUSION' }
                }]));
              }
              break;
          }
        } catch (error) {
          console.error('Action processing failed:', error);
          setMessages(prev => GiftedChat.append(prev, [{
            _id: Date.now() + Math.random(),
            text: "⚠️ Oops, something went wrong. Let's try that again.",
            createdAt: new Date(),
            user: { _id: 2, name: 'FUSION' }
          }]));
        }
      } else {
        // Show only the cleaned response if no action is needed
        setMessages(prev => GiftedChat.append(prev, [{
          _id: Date.now() + Math.random(),
          text: cleanedResponse,
          createdAt: new Date(),
          user: { _id: 2, name: 'FUSION' }
        }]));
      }

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      
      // Use aiResponse directly since cleanedResponse might not exist
      const displayText = aiResponse || "Let's try that again. Could you clarify your request?";
      
      setMessages(prev => GiftedChat.append(prev, [{
        _id: Date.now(),
        text: displayText,
        createdAt: new Date(),
        user: { _id: 2, name: 'FUSION' }
      }]));
    } finally {
      // Only set isLoading false here if it wasn't a local command
      // Local commands set it false earlier
      if (!userMessageText?.startsWith('/list-')) {
        setIsLoading(false);
      }
    }
  }, [messages, createTask, updateTask, deleteTask, tasks, refreshTasks, router, scheduleTaskReminder, cancelTaskReminder, scheduleEventReminder, cancelEventReminder]);

  // Custom composer component to handle Enter and Shift+Enter
  //Aaron: Custom composer with microphone button
  const renderComposer = (props: any) => {
    const handleKeyPress = (e: any) => {
      if (e.nativeEvent.key === 'Enter') {
        if (e.nativeEvent.shiftKey) return;
        
        e.preventDefault();
        if (inputText.trim()) {
          const message = {
            _id: Date.now(),
            text: inputText.trim(),
            createdAt: new Date(),
            user: { _id: 1 }
          };
          handleSend([message]);
          setInputText('');
          setShowSuggestions(false);
        }
      }
    };

    return (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', width: '90%' }}>
        <View style={{ flex: 1 }}>
          <CommandSuggestions />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={handleInputChange}
              onKeyPress={handleKeyPress}
              multiline
              placeholder="Type your message here..."
              placeholderTextColor={theme.colors.outline}
              style={{
                flex: 1,
                minHeight: 40,
                maxHeight: 120,
                borderRadius: 20,
                paddingHorizontal: 15,
                paddingVertical: 8,
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.onSurface,
                marginVertical: 5,
                marginRight: 5
              }}
            />
            <TouchableOpacity
              onPress={handleVoiceInput}
              style={{
                padding: 8,
                marginLeft: 5
              }}
            >
              <MaterialCommunityIcons
                name="microphone"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
        {speechError && (
          <Text style={{
            color: theme.colors.error,
            fontSize: 12,
            marginLeft: 16,
            marginTop: 4
          }}>
            {speechError}
          </Text>
        )}
      </View>
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        renderComposer={renderComposer}
        containerStyle={{
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.background,
          borderTopWidth: 1,
          padding: 0,
          width: '100%',
          height: 60,
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 8 : 0,
        }}
        primaryStyle={{
          flex: 1,
          flexDirection: 'row', // Added to align items horizontally
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}
        renderActions={() => ( // Added renderActions
          <TouchableOpacity
            onPress={handleConfirmClearChat} // Call the confirmation function
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 5, // Added margin for spacing
            }}
          >
            <MaterialCommunityIcons
              name="delete-outline" // Delete icon
              size={24}
              color={theme.colors.onSurfaceVariant} // Icon color
            />
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: theme.colors.primary,
        },
        left: {
          backgroundColor: theme.colors.surfaceVariant,
        },
      }}
      textStyle={{
        right: {
          color: '#CBCBCB',
        },
        left: {
          color: theme.colors.onSurfaceVariant,
        },
      }}
      timeTextStyle={{
        right: {
          color: '#CBCBCB',
        },
        left: {
          color: theme.colors.onSurfaceVariant,
        },
      }}
    />
  );

  const renderSend = (props: any) => (
    <Send 
      {...props}
      disabled={!inputText.trim()}
      containerStyle={{
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 5
      }}
    >
      <MaterialCommunityIcons
        name="send-circle"
        size={32}
        color={inputText.trim() ? theme.colors.primary : theme.colors.outline}
      />
    </Send>
  );

  // Clear chat history function
  const clearChatHistory = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setMessages([{
        _id: Date.now(),
        text: 'Chat history cleared. How can I help you today?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'FUSION',
          avatar: 'https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-blank/assets/icon.png',
        },
      }]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const handleConfirmClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to delete all messages?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: clearChatHistory,
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

//Aaron: Function to delete all tasks, events, and chat history
  const handleDeleteAllData = async () => {
    try {
      // Clear chat history
      await clearChatHistory();

      // Delete all tasks
      for (const task of tasks) {
        await deleteTask(task.id);
      }
      await refreshTasks(); // Refresh tasks state after deletion

      // Delete all events
      for (const event of events) {
        await deleteEvent(event.id);
      }
      await refreshEvents(); // Refresh events state after deletion

      // Optionally, add a message to the chat confirming deletion
      setMessages([{
        _id: Date.now(),
        text: 'All tasks, events, and chat history have been deleted.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'FUSION',
          avatar: 'https://raw.githubusercontent.com/expo/expo/master/templates/expo-template-blank/assets/icon.png',
        },
      }]);

    } catch (error) {
      console.error('Error deleting all data:', error);
      setMessages(prev => GiftedChat.append(prev, [{
        _id: Date.now(),
        text: 'An error occurred while trying to delete all data.',
        createdAt: new Date(),
        user: { _id: 2, name: 'FUSION' }
      }]));
    }
  };

  const renderAvatar = (props: any) => {
    if (props.currentMessage.user._id === 2) {
      return (
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 8
        }}>
          <MaterialCommunityIcons name="robot" size={24} color="white" />
        </View>
      );
    }
    return null; // Use default avatar for user
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.background
      }
    ]}>
      <GiftedChat
        messages={messages}
        onSend={handleSend}
        user={{ _id: 1 }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        text={inputText}
        onInputTextChanged={handleInputChange}
        placeholder="Type your message here..."
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        isLoadingEarlier={isLoading}
        renderAvatar={renderAvatar}
        inverted={true}
        alwaysShowSend={true}
        scrollToBottomOffset={300}
        maxComposerHeight={100}
        minComposerHeight={40}

        invertibleScrollViewProps={{
          initialNumToRender: 20,
          maintainVisibleContentPosition: {
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: '100%',
        left: 5,
        right: 5,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        maxHeight: 300,
        zIndex: 1000,
        marginBottom: 8,
      },
      suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
      },
      suggestionBorder: {
        borderBottomWidth: 1,
      },
      suggestionIcon: {
        marginRight: 12,
      },
      suggestionText: {
        flex: 1,
      },
      commandText: {
        fontSize: 14,
        fontWeight: '600',
      },
      descriptionText: {
        fontSize: 12,
        marginTop: 2,
      },
      optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
      },
    });
