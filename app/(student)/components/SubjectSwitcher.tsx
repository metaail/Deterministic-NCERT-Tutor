import React from 'react';

interface SubjectSwitcherProps {
  subjectCode: string;
  onChange: (code: string) => void;
}

export function SubjectSwitcher({ subjectCode, onChange }: SubjectSwitcherProps) {
  return (
    <select 
      className="bg-gray-100/50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 py-1.5 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
      value={subjectCode} 
      onChange={e => onChange(e.target.value)} 
      suppressHydrationWarning
    >
      <option value="042">Physics</option>
      <option value="043">Chemistry</option>
      <option value="044">Biology</option>
      <option value="041">Mathematics</option>
    </select>
  );
}
