import React from 'react';
import { ExtendedMessage } from '../../../lib/chat/useStreamingChat';
import { AlertCircle, HelpCircle, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';

interface OutOfScopeCardProps {
  message: ExtendedMessage;
  onForceGeneral?: (query: string) => void;
  onSuggestionSelect?: (query: string) => void;
}

export function OutOfScopeCard({ message, onForceGeneral, onSuggestionSelect }: OutOfScopeCardProps) {
  const metadata = message.metadata;
  const suggestedChapter = metadata?.suggestedChapter;
  const relatedQuestions = metadata?.relatedQuestions || [];

  return (
    <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-orange-900 font-medium mb-1">Not found in selected chapter</p>
          <p className="text-orange-800/80 text-sm">{message.content}</p>
        </div>
      </div>

      {suggestedChapter && (
        <div className="px-1 text-gray-700">
          <span className="font-semibold text-gray-900">Suggested Chapter:</span> This concept may belong to <span className="font-semibold text-indigo-600">{suggestedChapter}</span>. Please switch to this chapter for an NCERT-grounded answer.
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <h4 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Options</h4>
        
        <button 
           className="flex items-center gap-2 w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
           onClick={() => {
              // we don't know the original query from the model message, wait.
              // We need it from the previous user message! 
              // But we can trigger an event and pass null, then the page handles taking the last User message.
              if (onForceGeneral) onForceGeneral("general"); 
           }}
        >
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-indigo-300 group-hover:text-indigo-600">
             <ExternalLink size={16} />
          </div>
          <div>
            <div className="font-medium text-gray-900 group-hover:text-indigo-700">Ask in General Doubt Mode</div>
            <div className="text-xs text-gray-500">Get an unverified answer outside NCERT boundaries.</div>
          </div>
        </button>

      </div>

      {relatedQuestions.length > 0 && (
         <div className="mt-2">
            <h4 className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-2">Related questions from this chapter:</h4>
            <div className="flex flex-wrap gap-2">
               {relatedQuestions.map((q, idx) => (
                  <button 
                     key={idx}
                     onClick={() => onSuggestionSelect && onSuggestionSelect(q)}
                     className="text-left px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium transition-colors border border-gray-200"
                  >
                     {q}
                  </button>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
