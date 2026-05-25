import { planRetrieval } from '../lib/chat/retrievalPlanner';

async function test() {
   const contextPayload = await planRetrieval({
        query: "What is the cartesian product of two non-empty sets?",
        subjectCode: "041",
        classLevel: "Class 11",
        chapterKey: "ch-maths-1779381135982",
        history: []
   }, 'concept_explanation');

   console.log(JSON.stringify(contextPayload.textChunks[0], null, 2));
}

test();
