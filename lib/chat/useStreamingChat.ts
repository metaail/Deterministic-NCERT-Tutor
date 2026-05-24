import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from './chatTypes';

export type ExtendedMessage = ChatMessage & {
  metadata?: {
    textChunks?: any[];
    intent?: string;
    pyqs?: any[];
  }
};

export function useStreamingChat() {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const sendMessage = useCallback(async (
    query: string,
    subjectCode: string,
    classLevel: string,
    chapterKey: string,
    history: ChatMessage[]
  ) => {
    if (!query.trim() || !chapterKey) return;
    
    const userMsg: ExtendedMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode,
          classLevel,
          chapterKey,
          query: userMsg.content,
          history: history.slice(-5)
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch response');
      }

      let incomingMsg: ExtendedMessage = { role: 'model', content: '' };
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        let isFirstData = true;
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
             setIsLoading(false);
             break;
          }

          if (isFirstData) {
            setMessages(prev => [...prev, incomingMsg]);
            isFirstData = false;
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            if (part.startsWith('data: ')) {
              try {
                const dataObj = JSON.parse(part.slice(6));
                if (dataObj.error) {
                  throw new Error(dataObj.error);
                }
                
                let updated = false;
                if (dataObj.content) {
                  incomingMsg.content += dataObj.content;
                  updated = true;
                }
                
                if (dataObj.metadata) {
                  incomingMsg.metadata = {
                    ...incomingMsg.metadata,
                    ...dataObj.metadata
                  };
                  updated = true;
                }
                
                if (updated) {
                  setMessages(prev => {
                    const newArr = [...prev];
                    newArr[newArr.length - 1] = { ...incomingMsg };
                    return newArr;
                  });
                }
              } catch(e) {
                console.warn('JSON parse error from stream chunk', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  return { messages, setMessages, sendMessage, isLoading, error };
}
