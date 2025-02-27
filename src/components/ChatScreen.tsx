import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { GiftedChatWrapper as GiftedChat } from './GiftedChatWrapper';
import { Bubble, InputToolbar } from 'react-native-gifted-chat';
import axios from 'axios';
import { CHAT_CONFIG } from '@/config/chat';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [systemMessage, setSystemMessage] = useState(
    'You are a Task manager and your name is FUSION, act like a professional task manager, who assists in setting events in an efficient way that high priority will be given more importance and first collect all data of the user for event management.'
  );

  const giftedChatRef = useRef();

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello! How can I assist you today?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'FUSION',
          avatar: 'https://placeimg.com/140/140/any',
        },
      },
    ]);
  }, []);

  const handleSend = useCallback(async (newMessages = []) => {
    try {
      setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));

      const conversationHistory = messages.map((msg) => ({
        role: msg.user._id === 1 ? 'user' : 'assistant',
        content: msg.text,
      }));

      conversationHistory.push({
        role: 'user',
        content: newMessages[0].text,
      });

      const payload = {
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: [
          { role: 'system', content: systemMessage },
          ...conversationHistory,
        ],
      };

      const response = await axios.post(
        CHAT_CONFIG.API_URL,
        payload,
        {
          headers: {
            Authorization: `Bearer ${CHAT_CONFIG.API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': CHAT_CONFIG.SITE_URL,
            'X-Title': CHAT_CONFIG.SITE_NAME,
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;

      const aiMessage = {
        _id: Math.random().toString(),
        text: aiResponse,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'FUSION',
          avatar: 'https://placeimg.com/140/140/any',
        },
      };

      setMessages((previousMessages) => GiftedChat.append(previousMessages, [aiMessage]));

      if (giftedChatRef.current) {
        giftedChatRef.current.scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        _id: Math.random().toString(),
        text: 'Sorry, something went wrong. Please try again.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'FUSION',
          avatar: 'https://placeimg.com/140/140/any',
        },
      };
      setMessages((previousMessages) => GiftedChat.append(previousMessages, [errorMessage]));
    }
  }, [messages, systemMessage]);

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#007AFF',
          },
          left: {
            backgroundColor: '#E5E5EA',
          },
        }}
        textStyle={{
          right: {
            color: '#FFF',
          },
          left: {
            color: '#000',
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        }}
        renderComposer={(composerProps) => (
          <CustomComposer {...composerProps} onSend={props.onSend} />
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <GiftedChat
        ref={giftedChatRef}
        messages={messages}
        onSend={(newMessages) => handleSend(newMessages)}
        user={{
          _id: 1,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        alwaysShowSend
        keyboardShouldPersistTaps="handled"
        bottomOffset={Platform.select({
          ios: 0,
          android: 0,
        })}
      />
    </View>
  );
};

const CustomComposer = ({ onSend, ...composerProps }) => {
  const [text, setText] = useState('');

  const handleKeyPress = (event) => {
    if (event.nativeEvent.key === 'Enter' && !event.nativeEvent.shiftKey) {
      event.preventDefault();
      if (text.trim()) {
        onSend([{ text: text.trim() }]);
        setText('');
      }
    }
  };

  return (
    <TextInput
      {...composerProps}
      value={text}
      onChangeText={setText}
      onKeyPress={handleKeyPress}
      multiline
      placeholder="Type a message..."
      style={{
        flex: 1,
        marginLeft: 10,
        marginRight: 10,
        paddingTop: 8,
        paddingBottom: 8,
        fontSize: 16,
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default ChatScreen; 