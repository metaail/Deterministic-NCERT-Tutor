import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ChunkCard } from './ChunkCard';
import { PYQCard } from './PYQCard';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: any[];
}

export function MobileDrawer({ isOpen, onClose, metadata }: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-3xl shadow-xl z-50 lg:hidden flex flex-col border-t border-gray-200"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-800">References & PYQs</h3>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {metadata && metadata.length > 0 ? (
                metadata.map((item, idx) => (
                  item.type === 'pyq' ? (
                    <PYQCard key={idx} pyq={item} />
                  ) : (
                    <ChunkCard key={idx} chunk={item} />
                  )
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <div className="p-3 bg-gray-50 rounded-full">
                    <X size={24} className="opacity-50" />
                  </div>
                  <p className="text-sm">No references loaded.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
