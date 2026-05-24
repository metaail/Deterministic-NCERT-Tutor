import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

export function PerformanceBadge({ timeMs, score }: { timeMs?: number, score?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium ml-3"
    >
      <Activity size={12} className="text-green-600" />
      <span>RAG Enabled</span>
      {timeMs && <span className="opacity-75">({timeMs}ms)</span>}
    </motion.div>
  );
}
