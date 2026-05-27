import { ContextPayload } from './chatTypes';

export function getRelatedQuestionsFromContext(contextPayload: ContextPayload): string[] {
  // Extract up to 3 sample questions based on the retrieved text chunks or structure index
  const questions: string[] = [];
  
  if (contextPayload.structureIndex && contextPayload.structureIndex.topics) {
    for (const topic of Object.keys(contextPayload.structureIndex.topics)) {
      if (topic.length > 5) {
         questions.push(`What is ${topic}?`);
         if (questions.length >= 3) return questions;
      }
    }
  }

  // Fallback: extract concepts from textChunks if no structure index
  if (contextPayload.textChunks && contextPayload.textChunks.length > 0) {
     for (const chunk of contextPayload.textChunks) {
         if (questions.length >= 3) break;
         const text = chunk.text as string;
         if (!text) continue;
         
         // extract a concept word (very naive approach)
         const match = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/);
         if (match && match[1].length > 4 && !questions.includes(`Can you explain ${match[1]}?`)) {
             questions.push(`Can you explain ${match[1]}?`);
         }
     }
  }
  
  if (questions.length === 0) {
      questions.push("What are the key concepts in this chapter?");
      questions.push("Can you give me an overview of this chapter?");
  }
  
  return questions.slice(0, 3);
}
