import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface ChunkCardProps {
  chunk: any;
}

export function ChunkCard({ chunk }: ChunkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Never expose images or diagrams
  const title = chunk.metadata?.sectionTitle || "NCERT Text";
  const pageStr = chunk.metadata?.pageNumber ? `Page ${chunk.metadata.pageNumber}` : "";
  const contentStr = typeof chunk.content === 'string' ? chunk.content : (chunk.text || "");
  
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
              {pageStr && <span className="text-[10px] text-gray-500">{pageStr}</span>}
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
