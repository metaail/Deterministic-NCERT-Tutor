import React from 'react';

interface ChapterNavigatorProps {
  chapters: any[];
  chapterKey: string;
  onChange: (key: string) => void;
  isLoading?: boolean;
}

export function ChapterNavigator({ chapters, chapterKey, onChange, isLoading }: ChapterNavigatorProps) {
  if (isLoading) {
    return <span className="text-sm text-gray-400 py-1.5 px-3">Loading chapters...</span>;
  }

  return (
    <select 
      className="max-w-[200px] truncate bg-gray-100/50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 py-1.5 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
      value={chapterKey}
      onChange={e => onChange(e.target.value)}
      suppressHydrationWarning
    >
      {chapters.length === 0 && <option value="">No chapters available</option>}
      {chapters.map(c => (
        <option key={c.id} value={c.id}>{c.chapterTitle || c.id}</option>
      ))}
    </select>
  );
}
