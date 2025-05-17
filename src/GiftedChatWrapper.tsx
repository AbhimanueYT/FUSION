import { GiftedChat as OriginalGiftedChat, IMessage } from 'react-native-gifted-chat';

export const GiftedChatWrapper = OriginalGiftedChat;

// Add static methods with generic type
GiftedChatWrapper.append = <TMessage extends IMessage>(
  previousMessages: TMessage[] = [] as TMessage[],
  messages: TMessage[]
): TMessage[] => {
  return OriginalGiftedChat.append(previousMessages, messages);
}; 