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

    let attempt = 0;
    const maxRetries = 3;

    while (attempt <= maxRetries) {
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
          if (res.status >= 500 && attempt < maxRetries) {
            attempt++;
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch response: ${res.status}`);
        }

        let incomingMsg: ExtendedMessage = { role: 'model', content: '' };
        
        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');

        if (reader) {
          let isFirstData = true;
          let buffer = '';
          while (true) {
            let value, done;
            try {
              const result = await reader.read();
              value = result.value;
              done = result.done;
            } catch (streamErr) {
              throw new Error(`Stream read error: ${streamErr instanceof Error ? streamErr.message : 'Unknown'}`);
            }

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
                    if ((dataObj.status && dataObj.status >= 500) || String(dataObj.error).includes('500')) {
                      throw new Error(`Network-related stream error: ${dataObj.error}`);
                    }
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
                  if (e instanceof Error && e.message.includes('Network-related')) throw e;
                  console.warn('JSON parse error from stream chunk', e);
                }
              }
            }
          }
        }
        break; // Success, exit retry loop
      } catch (err: any) {
        const msg = String(err.message || '');
        const isNetworkOr500 = msg.includes('fetch') || 
                               msg.includes('network') || 
                               msg.includes('500') ||
                               msg.includes('Stream read error');

        if (attempt < maxRetries && isNetworkOr500) {
          attempt++;
          // Remove the partially formed message if we added it, to prevent duplicates on retry
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'model') {
              return prev.slice(0, -1);
            }
            return prev;
          });
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        
        if (msg === 'Failed to fetch') {
          setError('Network error: Unable to connect to the server. Please check your connection or try again later.');
        } else {
          setError(msg);
        }
        setIsLoading(false);
        break;
      }
    }
  }, []);

  return { messages, setMessages, sendMessage, isLoading, error };
}
