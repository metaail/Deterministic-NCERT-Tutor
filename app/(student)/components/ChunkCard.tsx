import React from 'react';
import { FileText } from 'lucide-react';

interface ChunkCardProps {
  chunk: any;
}

export function ChunkCard({ chunk }: ChunkCardProps) {
  // Never expose images or diagrams
  const title = chunk.metadata?.sectionTitle || "NCERT Text";
  const pageStr = chunk.metadata?.pageNumber ? `Page ${chunk.metadata.pageNumber}` : "";
  const contentStr = typeof chunk.content === 'string' ? chunk.content : (chunk.text || "");
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow text-left">
       <div className="flex items-start gap-2 mb-2">
         <FileText size={14} className="text-gray-400 mt-1 flex-shrink-0" />
         <div>
            <h4 className="text-xs font-semibold text-gray-700 line-clamp-1">{title}</h4>
            {pageStr && <span className="text-[10px] text-gray-500">{pageStr}</span>}
         </div>
       </div>
       <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed font-serif">
         &quot;{contentStr}&quot;
       </p>
    </div>
  );
}
