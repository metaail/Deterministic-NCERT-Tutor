import React from 'react';
import { ExtendedMessage } from '../../../lib/chat/useStreamingChat';
import { StreamingRenderer } from './StreamingRenderer';
import { BookOpen } from 'lucide-react';

interface MessageBubbleProps {
  message: ExtendedMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group relative`}>
      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${
        isUser 
          ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm' 
          : 'bg-white border border-gray-200/60 shadow-sm rounded-bl-sm text-gray-800'
      }`}>
        {!isUser && (
           <div className="flex items-center gap-2 mb-2 text-indigo-600">
             <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
               <BookOpen size={14} className="text-indigo-600" />
             </div>
             <span className="text-xs font-semibold tracking-wide uppercase">AI Tutor</span>
           </div>
        )}
        
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        ) : (
          <StreamingRenderer content={message.content} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
}
