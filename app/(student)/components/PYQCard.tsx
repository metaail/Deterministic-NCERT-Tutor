import React from 'react';
import { Award } from 'lucide-react';

interface PYQCardProps {
  pyq: any;
}

export function PYQCard({ pyq }: PYQCardProps) {
  const contentStr = typeof pyq === 'string' ? pyq : (pyq.content || pyq.text || JSON.stringify(pyq));
  const examInfo = pyq.metadata?.exam || "Previous Year Question";
  const yearStr = pyq.metadata?.year ? ` (${pyq.metadata.year})` : "";

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow text-left">
       <div className="flex items-start gap-2 mb-2">
         <Award size={14} className="text-amber-600 mt-1 flex-shrink-0" />
         <div>
            <h4 className="text-xs font-semibold text-amber-800 line-clamp-1">{examInfo}{yearStr}</h4>
         </div>
       </div>
       <p className="text-xs text-amber-900/80 line-clamp-4 leading-relaxed whitespace-pre-wrap">
         {contentStr}
       </p>
    </div>
  );
}
