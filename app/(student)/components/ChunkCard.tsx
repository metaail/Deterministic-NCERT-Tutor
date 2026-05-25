import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface ChunkCardProps {
  chunk: any;
}

export function ChunkCard({ chunk }: ChunkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Never expose images or diagrams
  const title = chunk.sectionTitle || chunk.chapterTitle || "NCERT Text";
  const pageStr = chunk.pageNumber ? `Page ${chunk.pageNumber}` : "";
  const contentStr = chunk.textPreview || chunk.content || chunk.text || "";
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow text-left cursor-pointer group"
      onClick={() => setIsExpanded(!isExpanded)}
    >
       <div className="flex items-start justify-between mb-2">
         <div className="flex items-start gap-2">
           <FileText size={14} className="text-gray-400 mt-1 flex-shrink-0" />
           <div>
              <h4 className="text-xs font-semibold text-gray-700 line-clamp-1">{title}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                {pageStr && <span className="text-[10px] text-gray-500">{pageStr}</span>}
                {chunk.score !== undefined && (
                  <div className="flex items-center gap-2" title={`${Math.round(chunk.score * 100)}% Match`}>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium whitespace-nowrap">
                      {Math.round(chunk.score * 100)}% Match
                    </span>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.max(0, Math.min(100, chunk.score * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
           </div>
         </div>
         <div className="text-gray-300 group-hover:text-gray-500 transition-colors">
           {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
         </div>
       </div>
       <p className={`text-xs text-gray-600 leading-relaxed font-serif ${isExpanded ? '' : 'line-clamp-4'}`}>
         &quot;{contentStr}&quot;
       </p>
    </div>
  );
}
