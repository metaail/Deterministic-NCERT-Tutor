import { evaluateGroundingConfidence } from './lib/chat/groundingGuard';
import { planRetrieval } from './lib/chat/retrievalPlanner';

async function testIt() {
  const chapterId = 'ch-maths-1779381135982';
  const query = 'How many examples are there in this chapter Write all the examples';
  const subjectCode = '041';
  const classLevel = 'Class 11';
  
  try {
    const payload = await planRetrieval({
      query, subjectCode, classLevel, chapterKey: chapterId, history: []
    }, 'structure_query');
    
    console.log(payload.textChunks.map(c => c.textPreview).join('\n---\n'));
  } catch (err) {
    console.error(err);
  }
}

testIt().catch(console.error);
