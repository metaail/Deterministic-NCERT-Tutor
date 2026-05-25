import { useState, useEffect } from 'react';
import { ExtendedMessage } from './useStreamingChat';
import { auth, db } from '../firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'tutor_conversation_memory';

export function useConversationMemory() {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. Listen to Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // 2. Load Memory (Firestore if logged in, SessionStorage otherwise)
  useEffect(() => {
    if (userId && db) {
      const docRef = doc(db, 'users', userId, 'chat', 'memory');
      const unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.messages) {
            setMessages(data.messages as ExtendedMessage[]);
          }
        } else {
          try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              setMessages(parsed);
              setDoc(docRef, { messages: parsed }, { merge: true });
            }
          } catch (e) {
            console.error("Failed to load local memory", e);
          }
        }
      }, (error) => {
        console.error("Failed to load firestore memory", error);
      });
      return () => unsubscribe();
    } else {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          setMessages(JSON.parse(stored));
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to load conversation memory", e);
      }
    }
  }, [userId]);

  const updateMessages = (newMessages: ExtendedMessage[] | ((prev: ExtendedMessage[]) => ExtendedMessage[])) => {
    setMessages(prev => {
      const next = typeof newMessages === 'function' ? newMessages(prev) : newMessages;
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
         console.error("Failed to save memory", e);
      }
      
      if (userId && db) {
        const docRef = doc(db, 'users', userId, 'chat', 'memory');
        setDoc(docRef, { messages: next }, { merge: true }).catch(err => {
          console.error("Failed to sync memory to Firestore", err);
        });
      }
      return next;
    });
  };

  const clearMemory = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    
    if (userId && db) {
      const docRef = doc(db, 'users', userId, 'chat', 'memory');
      deleteDoc(docRef).catch(err => {
        console.error("Failed to clear memory in Firestore", err);
      });
    }
  };

  return { memoryMessages: messages, updateMessages, clearMemory };
}
