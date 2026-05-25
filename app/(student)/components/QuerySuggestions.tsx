import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface QuerySuggestionsProps {
  onSelect: (query: string) => void;
}

const SUGGESTIONS = [
  "Explain the difference between plant and animal cells",
  "How to solve quadratic equations?",
  "What is Newton's second law of motion?",
  "Show me previous year questions on thermodynamics"
];

export function QuerySuggestions({ onSelect }: QuerySuggestionsProps) {
  return (
    <div className="w-full max-w-2xl mt-8">
      <div className="flex items-center gap-2 mb-3 px-2 text-sm font-medium text-gray-500">
        <Sparkles size={16} className="text-indigo-500" />
        <span>Try asking about...</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SUGGESTIONS.map((suggestion, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(suggestion)}
            className="text-left p-3 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-colors text-sm text-gray-700 shadow-sm"
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
