import React from 'react';
import { ExtendedMessage } from '../../../lib/chat/useStreamingChat';
import { StreamingRenderer } from './StreamingRenderer';
import { BookOpen, HelpCircle } from 'lucide-react';
import { OutOfScopeCard } from './OutOfScopeCard';

interface MessageBubbleProps {
  message: ExtendedMessage;
  isStreaming?: boolean;
  onForceGeneral?: () => void;
  onSuggestionSelect?: (query: string) => void;
}

export function MessageBubble({ message, isStreaming = false, onForceGeneral, onSuggestionSelect }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  const isOutOfScope = message.metadata?.outOfScope === true;
  const isGeneralDoubt = message.metadata?.isGeneralDoubt === true;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group relative`}>
      <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 ${
        isUser 
          ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm' 
          : isOutOfScope 
            ? 'bg-white rounded-bl-sm' 
            : isGeneralDoubt 
              ? 'bg-amber-50 border border-amber-200/60 shadow-sm rounded-bl-sm text-gray-800'
              : 'bg-white border border-gray-200/60 shadow-sm rounded-bl-sm text-gray-800'
      }`}>
        {!isUser && !isOutOfScope && !isGeneralDoubt && (
           <div className="flex items-center gap-2 mb-2 text-indigo-600">
             <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
               <BookOpen size={14} className="text-indigo-600" />
             </div>
             <span className="text-xs font-semibold tracking-wide uppercase">AI Tutor</span>
           </div>
        )}
        
        {!isUser && isGeneralDoubt && (
           <div className="flex items-center gap-2 mb-3 text-amber-700 border-b border-amber-200/50 pb-2">
             <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
               <HelpCircle size={14} className="text-amber-700" />
             </div>
             <span className="text-xs font-semibold tracking-wide uppercase">General Doubt (Not NCERT Verified)</span>
           </div>
        )}
        
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
        ) : isOutOfScope ? (
          <OutOfScopeCard message={message} onForceGeneral={onForceGeneral} onSuggestionSelect={onSuggestionSelect} />
        ) : (
          <StreamingRenderer content={message.content} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  );
}
