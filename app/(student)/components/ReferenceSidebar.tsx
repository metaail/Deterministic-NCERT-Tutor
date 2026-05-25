import React from 'react';
import { ChunkCard } from './ChunkCard';
import { PYQCard } from './PYQCard';
import { X, BookOpen, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferenceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: any;
}

export function ReferenceSidebar({ isOpen, onClose, metadata }: ReferenceSidebarProps) {
  const textChunks = metadata?.textChunks || [];
  const pyqs = metadata?.pyqs || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="border-l border-gray-200 bg-gray-50 flex flex-col hidden lg:flex overflow-hidden"
        >
          <div className="w-[320px] h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-800">Grounding Sources</h3>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {pyqs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PYQ Matches</h4>
                  {pyqs.map((pyq: any, i: number) => (
                    <PYQCard key={`pyq-${i}`} pyq={pyq} />
                  ))}
                </div>
              )}
              
              {textChunks.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">NCERT Chapters</h4>
                  {textChunks.map((chunk: any, i: number) => (
                    <ChunkCard key={`chunk-${i}`} chunk={chunk} />
                  ))}
                </div>
              ) : (
                 <div className="text-xs text-gray-400 italic text-center mt-10">
                   No specific NCERT text chunks retrieved for this turn.
                 </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
