'use client';

import { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ChatMessage } from '@/lib/chat/chatTypes';
import { motion } from 'motion/react';

const ThinkingAnimation = () => (
  <div className="flex gap-1 items-center justify-center p-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
      />
    ))}
  </div>
);
import { getPublishedChapters } from '@/lib/chat/getPublishedChapters';

// Assuming basic defaults for demo. In a real app, these would come from the database/dropdown.
export default function StudentChatPage() {
  const [subjectCode, setSubjectCode] = useState('041'); // Math preferred now
  const [classLevel, setClassLevel] = useState('Class 11');
  const [chapterKey, setChapterKey] = useState('');
  
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const scrollContent = containerRef.current.querySelector('#scroll-content');
    if (!scrollContent) return;
    const observer = new ResizeObserver(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    observer.observe(scrollContent);
    return () => observer.disconnect();
  }, [messages, isLoading]);


  useEffect(() => {
    async function load() {
      try {
        const chapters = await getPublishedChapters();
        setAvailableChapters(chapters);
        // set default chapter if available
        const filtered = chapters.filter(c => 
          (c.subjectCode === subjectCode || (subjectCode === '041' && c.subject === 'Maths')) &&
          c.classLevel === classLevel
        );
        if (filtered.length > 0) {
          setChapterKey(filtered[0].id);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoadingChapters(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update chapterKey when subject/class changes
  useEffect(() => {
    const filtered = availableChapters.filter(c => 
      (c.subjectCode === subjectCode || (subjectCode === '041' && c.subject === 'Maths')) &&
      c.classLevel === classLevel
    );
    if (filtered.length > 0) {
      if (!filtered.find(c => c.id === chapterKey)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setChapterKey(filtered[0].id);
      }
    } else {
       
      setChapterKey('');
    }
  }, [subjectCode, classLevel, availableChapters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!query.trim() || !chapterKey) return;
    
    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode,
          classLevel,
          chapterKey,
          query: userMsg.content,
          history: messages.slice(-5) // Send last 5 msgs
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      setMessages(prev => [...prev, data.message as ChatMessage]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChapters = availableChapters.filter(c => 
    (c.subjectCode === subjectCode || (subjectCode === '041' && c.subject === 'Maths')) &&
    c.classLevel === classLevel
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white border-x border-b border-gray-200 shadow-sm min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-800">Deterministic NCERT Tutor</h1>
          <p className="text-xs text-gray-500 mb-4">Phase 4 Chat RAG</p>
          <div className="flex gap-2 text-sm">
            <select className="border border-gray-200 rounded p-1" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} suppressHydrationWarning>
              <option value="042">Physics</option>
              <option value="043">Chemistry</option>
              <option value="044">Biology</option>
              <option value="041">Mathematics</option>
            </select>
            <select className="border border-gray-200 rounded p-1" value={classLevel} onChange={e => setClassLevel(e.target.value)} suppressHydrationWarning>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
            
            {loadingChapters ? (
               <span className="p-1 text-gray-400">Loading chapters...</span>
            ) : (
              <select 
                className="border border-gray-200 rounded p-1"
                value={chapterKey}
                onChange={e => setChapterKey(e.target.value)}
              >
                {filteredChapters.length === 0 && <option value="">No chapters available</option>}
                {filteredChapters.map(c => (
                  <option key={c.id} value={c.id}>{c.chapterTitle || c.id}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div ref={containerRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
          <div className="flex-1 flex flex-col gap-4" id="scroll-content">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
              <p>Type a question to begin.</p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl p-4 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 shadow-sm'}`}>
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                ) : (
                  <MarkdownRenderer content={m.content} />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 text-gray-400 text-sm">
                <ThinkingAnimation />
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
               <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-2 flex text-xs items-center max-w-sm">
                  {error}
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
          <input 
            type="text" 
            className="flex-1 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask a question about the chapter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            suppressHydrationWarning
          />
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            disabled={isLoading || !query.trim()}
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
