import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Lightbulb } from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';

interface EvidenceCardProps {
  chunk: any;
}

export function EvidenceCard({ chunk }: EvidenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const title = chunk.sectionTitle || chunk.chapterTitle || "NCERT Chapter";
  const pageStr = chunk.pageNumber ? `Page ${chunk.pageNumber}` : "";
  const contentStr = chunk.textPreview || chunk.content || chunk.text || "";
  
  // Calculate confidence visually (without showing raw percentage)
  let confidenceLabel = "Moderate Support";
  let ConfidenceIcon = CheckCircle;
  let confColor = "text-amber-500";
  
  if (chunk.score !== undefined) {
      if (chunk.score >= 0.70) {
          confidenceLabel = "Strong NCERT Support";
          confColor = "text-emerald-500";
      } else if (chunk.score < 0.40) {
          confidenceLabel = "Weak Support";
          confColor = "text-gray-400";
      }
  }

  // Derive "Why this was used" reason safely
  let rationale = "This NCERT section provides direct conceptual support for your query.";
  if (chunk.isDefinition) rationale = "This NCERT section was used because it defines the core concept.";
  if (chunk.isFormula || chunk.hasFormula) rationale = "This section contains the mathematical formulas needed to solve or explain the query.";
  if (chunk.isSolvedExample) rationale = "This NCERT example demonstrates how to apply the concept.";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all text-left group flex flex-col gap-2">
       <div className="flex items-start justify-between">
         <div className="flex flex-col items-start gap-1.5">
           <EvidenceBadge chunk={chunk} />
           <div>
              <h4 className="text-xs font-semibold text-gray-800 line-clamp-1">{title}</h4>
              <div className="flex items-center gap-2 mt-1">
                {pageStr && <span className="text-[10px] text-gray-500 font-medium">{pageStr}</span>}
                {chunk.score !== undefined && (
                  <div className="flex items-center gap-1.5" title={confidenceLabel}>
                    <ConfidenceIcon size={12} className={confColor} />
                    <span className={`text-[10px] font-medium ${confColor}`}>
                      {confidenceLabel}
                    </span>
                  </div>
                )}
              </div>
           </div>
         </div>
         <button 
           onClick={() => setIsExpanded(!isExpanded)}
           className="text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 p-1.5 rounded-md transition-colors"
         >
           {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
         </button>
       </div>

       {isExpanded && (
         <div className="mt-2 bg-indigo-50/50 rounded-lg p-2.5 border border-indigo-100/50 flex items-start gap-2">
            <Lightbulb size={12} className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-indigo-700 leading-tight">
               {rationale}
            </p>
         </div>
       )}

       <div className="relative mt-1">
         <div className={`text-[11.5px] text-gray-700 leading-relaxed font-serif bg-gray-50 p-2.5 rounded-lg border border-gray-100 ${isExpanded ? '' : 'line-clamp-3'}`}>
           &quot;{contentStr}&quot;
         </div>
       </div>

       {((chunk.figureRefs && chunk.figureRefs.length > 0) || chunk.isFigureCaption) && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
             <span>Visual reference available in NCERT textbook.</span>
          </div>
       )}
    </div>
  );
}

