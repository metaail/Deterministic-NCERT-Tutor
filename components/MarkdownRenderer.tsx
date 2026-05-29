'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Pre-process the content: remark-math usually prefers $ and $$ over \( and \[
  // However, our system generates \( and \[. Some versions of remark-math support them.
  // We can write a tiny preprocessor here just in case, mapping \( \) to $..$ and \[ \] to $$..$$
  // ONLY for display purposes so that remark-math parses it flawlessly if it lacks native support.
  let displayContent = content;
  displayContent = displayContent.replace(/\\\((.*?)\\\)/g, '$$$1$$');
  displayContent = displayContent.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');

  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[[rehypeKatex, { strict: 'ignore' }]]}
        components={{
           p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
