import React, { useEffect, useRef } from 'react';
import { ExtendedMessage } from '../../../lib/chat/useStreamingChat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuerySuggestions } from './QuerySuggestions';
import { SkeletonLoader } from './SkeletonLoader';

interface ChatWindowProps {
  messages: ExtendedMessage[];
  isLoading: boolean;
  error: string;
  onSuggestionSelect?: (query: string) => void;
}

export function ChatWindow({ messages, isLoading, error, onSuggestionSelect }: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    }, 10); // Small timeout allows Markdown DOM to paint before measuring
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl xl:max-w-5xl flex flex-col gap-6 pb-20">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center mt-12 sm:mt-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Your AI Study Buddy</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md">
                 Ask a question about your NCERT chapters, concepts, or previous year questions.
              </p>
            </div>
            {onSuggestionSelect && <QuerySuggestions onSelect={onSuggestionSelect} />}
          </div>
        )}

        {messages.map((m, idx) => (
          <MessageBubble 
            key={idx} 
            message={m} 
            isStreaming={isLoading && idx === messages.length - 1 && m.role === 'model'} 
          />
        ))}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
           <div className="flex justify-start w-full">
             <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-5 py-4 w-full max-w-sm">
               <SkeletonLoader />
             </div>
           </div>
        )}

        {error && (
          <div className="flex justify-center mt-4">
             <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm flex items-center max-w-sm">
                <span className="font-semibold mr-2">Error:</span> {error}
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

