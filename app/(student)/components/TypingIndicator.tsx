import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center p-2 h-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
          animate={{ y: ["0%", "-50%", "0%"], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
