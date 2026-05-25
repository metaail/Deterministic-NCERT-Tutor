import { planRetrieval } from '../lib/chat/retrievalPlanner';

async function test() {
   const contextPayload = await planRetrieval({
        query: "What is the cartesian product of two non-empty sets?",
        subjectCode: "041",
        classLevel: "Class 11",
        chapterKey: "ch-maths-1779381135982",
        history: []
   }, 'concept_explanation');

   console.log("Returned chunks: ", contextPayload.textChunks.length);
   if (contextPayload.textChunks.length > 0) {
       console.log("First chunk score:", contextPayload.textChunks[0].score);
       console.log("First chunk metadata:", contextPayload.textChunks[0].metadata);
   }
}

test();
