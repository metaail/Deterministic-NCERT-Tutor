import React from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface StreamingRendererProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingRenderer({ content, isStreaming }: StreamingRendererProps) {
  return (
    <div className="relative">
      <MarkdownRenderer content={content} />
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-600 animate-pulse align-middle rounded-sm" />
      )}
    </div>
  );
}
