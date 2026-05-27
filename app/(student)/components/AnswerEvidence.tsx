import React, { useState } from 'react';
import { EvidenceCard } from './EvidenceCard';
import { PYQCard } from './PYQCard';
import { X, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnswerEvidenceProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: any;
}

export function AnswerEvidence({ isOpen, onClose, metadata }: AnswerEvidenceProps) {
  const textChunks = metadata?.textChunks || [];
  const pyqs = metadata?.pyqs || [];
  const [showAllSupport, setShowAllSupport] = useState(false);

  const displayedChunks = showAllSupport ? textChunks : textChunks.slice(0, 2);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ width: 0, opacity: 0, x: 40 }}
          animate={{ width: 340, opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: 40 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="border-l border-gray-200 bg-gray-50 flex flex-col hidden lg:flex overflow-hidden shrink-0"
        >
          <div className="w-[340px] h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-gray-800">NCERT Evidence</h3>
              </div>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {pyqs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Related NEET/JEE PYQs</h4>
                  {pyqs.map((pyq: any, i: number) => (
                    <PYQCard key={`pyq-${i}`} pyq={pyq} />
                  ))}
                </div>
              )}
              
              {textChunks.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">NCERT Context</h4>
                  
                  <div className="flex flex-col gap-3">
                     {displayedChunks.map((chunk: any, i: number) => (
                       <EvidenceCard key={`chunk-${i}`} chunk={chunk} />
                     ))}
                  </div>

                  {textChunks.length > 2 && (
                     <button
                        onClick={() => setShowAllSupport(!showAllSupport)}
                        className="w-full mt-2 py-2 flex items-center justify-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100/50"
                     >
                       {showAllSupport ? (
                         <><ChevronUp size={14} /> Show Less</>
                       ) : (
                         <><ChevronDown size={14} /> Show {textChunks.length - 2} More Sources</>
                       )}
                     </button>
                  )}
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center mt-12 px-4 text-center">
                   <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Layers size={20} className="text-gray-400" />
                   </div>
                   <p className="text-sm text-gray-600 font-medium pb-1">No NCERT Context Used</p>
                   <p className="text-xs text-gray-400">The model did not retrieve specific NCERT passages for this answer.</p>
                 </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
