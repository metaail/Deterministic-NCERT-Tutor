import { useState, useEffect } from 'react';
import { ExtendedMessage } from './useStreamingChat';

const STORAGE_KEY = 'tutor_conversation_memory';

export function useConversationMemory() {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load conversation memory", e);
    }
  }, []);

  const updateMessages = (newMessages: ExtendedMessage[] | ((prev: ExtendedMessage[]) => ExtendedMessage[])) => {
    setMessages(prev => {
      const next = typeof newMessages === 'function' ? newMessages(prev) : newMessages;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
         console.error("Failed to save memory", e);
      }
      return next;
    });
  };

  const clearMemory = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  };

  return { memoryMessages: messages, updateMessages, clearMemory };
}
