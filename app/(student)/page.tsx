'use client';

import { useState, useEffect } from 'react';
import { useStreamingChat } from '@/lib/chat/useStreamingChat';
import { useConversationMemory } from '@/lib/chat/useConversationMemory';
import { useReferences } from '@/lib/chat/useReferences';
import { ChatWindow } from './components/ChatWindow';
import { ReferenceSidebar } from './components/ReferenceSidebar';
import { SubjectSwitcher } from './components/SubjectSwitcher';
import { ChapterNavigator } from './components/ChapterNavigator';
import { PerformanceBadge } from './components/PerformanceBadge';
import { MobileDrawer } from './components/MobileDrawer';
import { getPublishedChapters } from '@/lib/chat/getPublishedChapters';
import { Send, Menu, PanelRightClose, PanelRightOpen, Trash2, LibraryBig } from 'lucide-react';

export default function StudentChatPage() {
  const [subjectCode, setSubjectCode] = useState('041');
  const [classLevel, setClassLevel] = useState('Class 11');
  const [chapterKey, setChapterKey] = useState('');
  const [query, setQuery] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);

  const { memoryMessages, updateMessages, clearMemory } = useConversationMemory();
  const { messages, setMessages, sendMessage, isLoading, error } = useStreamingChat();
  const { isOpen, setIsOpen, hasReferences, metadata } = useReferences(messages);

  useEffect(() => {
    if (memoryMessages && messages.length === 0 && !isLoading) {
      setMessages(memoryMessages);
    }
  }, [memoryMessages, messages.length, isLoading, setMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      updateMessages(messages);
    }
  }, [messages, updateMessages]);

  useEffect(() => {
    async function load() {
      try {
        const chapters = await getPublishedChapters();
        setAvailableChapters(chapters);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChapterKey('');
    }
  }, [subjectCode, classLevel, availableChapters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!query.trim() || !chapterKey) return;
    const currentQuery = query;
    setQuery('');
    sendMessage(currentQuery, subjectCode, classLevel, chapterKey, messages);
    if (!isOpen && hasReferences) {
        setIsOpen(true);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    if (!chapterKey) return;
    sendMessage(suggestion, subjectCode, classLevel, chapterKey, messages);
    if (!isOpen && hasReferences) {
        setIsOpen(true);
    }
  };

  const handleClear = () => {
     clearMemory();
     setMessages([]);
  };

  const filteredChapters = availableChapters.filter(c => 
    (c.subjectCode === subjectCode || (subjectCode === '041' && c.subject === 'Maths')) &&
    c.classLevel === classLevel
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Header */}
         <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3 w-full max-w-7xl mx-auto">
             <div className="hidden sm:block text-lg font-bold text-gray-900 mr-2">NEET/JEE Tutor</div>
             <SubjectSwitcher subjectCode={subjectCode} onChange={setSubjectCode} />
             <select 
                className="bg-gray-100/50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 py-1.5 px-2 sm:px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                value={classLevel} 
                onChange={e => setClassLevel(e.target.value)} 
                suppressHydrationWarning
              >
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
             <ChapterNavigator 
               chapters={filteredChapters} 
               chapterKey={chapterKey} 
               onChange={setChapterKey} 
               isLoading={loadingChapters} 
             />
             
             {hasReferences && <PerformanceBadge />}

             <div className="flex-1" />

             {messages.length > 0 && (
                <button onClick={handleClear} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Clear Chat">
                  <Trash2 size={18} />
                </button>
             )}

             <button 
               onClick={() => setIsOpen(!isOpen)}
               className={`p-2 rounded-md transition-colors hidden lg:flex ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
               title="Toggle References"
             >
               {isOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
             </button>
             
             {/* Mobile Reference Trigger */}
             {hasReferences && (
               <button 
                 onClick={() => setIsMobileDrawerOpen(true)}
                 className="p-2 rounded-md text-indigo-600 bg-indigo-50 lg:hidden flex transition-colors"
               >
                 <LibraryBig size={20} />
               </button>
             )}
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0">
             <ChatWindow 
               messages={messages} 
               isLoading={isLoading} 
               error={error} 
               onSuggestionSelect={handleSuggestionSelect}
             />
             
             {/* Sticky Input Area */}
             <div className="p-4 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent pb-6 shrink-0">
               <div className="w-full max-w-4xl xl:max-w-5xl mx-auto relative rounded-2xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                 <textarea 
                   className="w-full bg-transparent px-4 py-4 pr-14 text-sm text-gray-800 focus:outline-none resize-none max-h-40 min-h-[56px]"
                   placeholder="Ask about formulas, concepts, or PYQs..."
                   value={query}
                   onChange={(e) => {
                     setQuery(e.target.value);
                     e.target.style.height = 'auto';
                     e.target.style.height = e.target.scrollHeight + 'px';
                   }}
                   rows={1}
                   onKeyDown={e => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSend();
                     }
                   }}
                   disabled={isLoading}
                   suppressHydrationWarning
                 />
                 <button 
                   className={`absolute right-2 bottom-2 p-2 rounded-xl transition-all ${
                     isLoading || !query.trim() 
                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                     : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                   }`}
                   disabled={isLoading || !query.trim()}
                   onClick={handleSend}
                 >
                   <Send size={16} />
                 </button>
               </div>
               <div className="text-center mt-2">
                 <span className="text-[11px] text-gray-400">AI can make mistakes. Verify critical concepts with NCERT.</span>
               </div>
             </div>
          </main>
          
          {/* Reference Sidebar */}
          <ReferenceSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} metadata={metadata} />
          
          <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} metadata={metadata} />
        </div>
      </div>
    </div>
  );
}
