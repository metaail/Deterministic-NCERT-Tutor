'use client';

import { useRef, useState, useEffect } from 'react';
import { useStreamingChat } from '@/lib/chat/useStreamingChat';
import { useConversationMemory } from '@/lib/chat/useConversationMemory';
import { useReferences } from '@/lib/chat/useReferences';
import { ChatWindow } from './components/ChatWindow';
import { AnswerEvidence } from './components/AnswerEvidence';
import { SubjectSwitcher } from './components/SubjectSwitcher';
import { ChapterNavigator } from './components/ChapterNavigator';
import { PerformanceBadge } from './components/PerformanceBadge';
import { MobileDrawer } from './components/MobileDrawer';
import { getPublishedChapters } from '@/lib/chat/getPublishedChapters';
import { Send, Menu, PanelRightClose, PanelRightOpen, Trash2, LibraryBig, Mic } from 'lucide-react';

export default function StudentChatPage() {
  const [subjectCode, setSubjectCode] = useState('041');
  const [classLevel, setClassLevel] = useState('Class 11');
  const [chapterKey, setChapterKey] = useState('');
  const [isGeneralMode, setIsGeneralMode] = useState(false);
  const [query, setQuery] = useState('');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  const [availableChapters, setAvailableChapters] = useState<any[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);

  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { memoryMessages, updateMessages, clearMemory } = useConversationMemory();
  const { messages, setMessages, sendMessage, cancelStream, isLoading, error } = useStreamingChat();
  const { isOpen, setIsOpen, hasReferences, metadata } = useReferences(messages);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = () => setIsDictating(true);
        recognition.onend = () => setIsDictating(false);
        recognition.onerror = (e: any) => {
          console.error('Speech recognition error', e.error);
          setIsDictating(false);
        };
        
        recognition.onresult = (e: any) => {
          let finalTranscript = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              finalTranscript += e.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
             setQuery(prev => prev + (prev.endsWith(' ') ? '' : ' ') + finalTranscript);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isDictating) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

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
        //
        setChapterKey(filtered[0].id);
      }
    } else {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setChapterKey('');
    }
  }, [subjectCode, classLevel, availableChapters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    if (!query.trim() || (!chapterKey && !isGeneralMode)) return;
    const currentQuery = query;
    setQuery('');
    sendMessage(currentQuery, subjectCode, classLevel, chapterKey || 'general', messages, isGeneralMode);
    if (!isOpen && hasReferences && !isGeneralMode) {
        setIsOpen(true);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    if (!chapterKey && !isGeneralMode) return;
    sendMessage(suggestion, subjectCode, classLevel, chapterKey || 'general', messages, isGeneralMode);
    if (!isOpen && hasReferences && !isGeneralMode) {
        setIsOpen(true);
    }
  };

  const handleClear = () => {
     cancelStream();
     clearMemory();
     setMessages([]);
  };

  const handleForceGeneral = () => {
    if (!chapterKey) return;
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content, subjectCode, classLevel, chapterKey, messages, true);
      if (!isOpen && hasReferences) {
          setIsOpen(true);
      }
    }
  };

  const filteredChapters = availableChapters.filter(c => 
    (c.subjectCode === subjectCode || (subjectCode === '041' && c.subject === 'Maths')) &&
    c.classLevel === classLevel
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Header */}
        {!isFocusMode && (
         <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3 w-full max-w-7xl mx-auto">
             <div className="hidden sm:block text-lg font-bold text-gray-900 mr-2">NEET/JEE Tutor</div>
             
             {/* Mode Toggle */}
             <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg border border-gray-200 mr-2 shrink-0">
               <button 
                 onClick={() => setIsGeneralMode(false)}
                 className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                   !isGeneralMode 
                   ? 'bg-white text-gray-900 shadow-sm' 
                   : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 Chapter Focus
               </button>
               <button 
                 onClick={() => setIsGeneralMode(true)}
                 className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                   isGeneralMode 
                   ? 'bg-white text-gray-900 shadow-sm' 
                   : 'text-gray-500 hover:text-gray-700'
                 }`}
               >
                 General Doubt
               </button>
             </div>

             {!isGeneralMode && (
               <>
                 <SubjectSwitcher subjectCode={subjectCode} onChange={setSubjectCode} />
                 <select 
                    className="bg-gray-100/50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 py-1.5 px-2 sm:px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer shrink-0"
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
               </>
             )}
             
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
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0">
             <ChatWindow 
               messages={messages} 
               isLoading={isLoading} 
               error={error} 
               onSuggestionSelect={handleSuggestionSelect}
               onForceGeneral={handleForceGeneral}
               isFocusMode={isFocusMode}
               onToggleFocusMode={() => {
                 setIsFocusMode(!isFocusMode);
                 if (!isFocusMode) {
                   setIsOpen(false);
                 }
               }}
             />
             
             {/* Sticky Input Area */}
             <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 z-20 shrink-0 relative pb-6">
               <div className="w-full max-w-4xl xl:max-w-5xl mx-auto relative rounded-2xl shadow-sm gemini-border transition-all">
                 <textarea 
                   className="w-full bg-transparent px-4 py-4 pr-24 text-sm text-gray-800 focus:outline-none resize-none max-h-40 min-h-[56px] relative z-10"
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
                 <div className="absolute right-2 bottom-2 flex items-center gap-1 z-10">
                   <button
                     className={`p-2 rounded-xl transition-all ${
                       isDictating
                       ? 'bg-red-50 text-red-500 shadow-sm animate-pulse'
                       : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                     }`}
                     onClick={toggleDictation}
                     disabled={isLoading}
                     title={isDictating ? "Stop dictating" : "Start Voice Input"}
                   >
                     <Mic size={16} />
                   </button>
                   <button 
                     className={`p-2 rounded-xl transition-all ${
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
               </div>
               <div className="text-center mt-2">
                 <span className="text-[11px] text-gray-400">AI can make mistakes. Verify critical concepts with NCERT.</span>
               </div>
             </div>
          </main>
          
          {/* Answer Evidence Sidebar */}
          <AnswerEvidence isOpen={isOpen} onClose={() => setIsOpen(false)} metadata={metadata} />
          
          <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} metadata={metadata} />
        </div>
      </div>
    </div>
  );
}
