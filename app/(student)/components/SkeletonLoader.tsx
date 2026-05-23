import { motion } from 'motion/react';

export function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <motion.div
        className="h-4 bg-gray-200 rounded-md"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      />
      <motion.div
        className="h-4 bg-gray-200 rounded-md w-4/5"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.div
        className="h-4 bg-gray-200 rounded-md w-2/3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.4 }}
      />
    </div>
  );
}
