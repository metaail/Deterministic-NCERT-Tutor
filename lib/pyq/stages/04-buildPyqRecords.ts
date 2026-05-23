import { PyqIngestionContext } from '../types';
import { PyqQuestion } from '../validators';

export async function buildPyqRecords(ctx: PyqIngestionContext): Promise<PyqIngestionContext> {
  const records: PyqQuestion[] = [];
  
  for (const rq of ctx.rawQuestions) {
    const record: PyqQuestion = {
      questionId: `${ctx.paperId}_Q${rq.questionNumber}`,
      paperId: ctx.paperId,
      exam: ctx.metadata.exam || "NEET",
      year: ctx.metadata.year || 2024,
      subject: ctx.metadata.subject || "Physics",
      chapterKey: rq.chapterKey,
      topicTags: rq.topicTags || [],
      conceptTags: rq.topicTags || [],
      matchKeywords: rq.topicTags || [],
      questionNumber: rq.questionNumber,
      questionText: rq.questionText,
      options: rq.options || [],
      answer: rq.answer || "",
      solutionText: rq.solutionText || "",
      hasVisual: rq.hasVisual,
      visualDependency: rq.visualDependency,
      visualReference: rq.visualReference,
      formulaRefs: [],
      difficulty: rq.difficulty || "Medium",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(record);
  }
  
  ctx.pyqRecords = records;
  ctx.metadata.totalQuestions = records.length;
  
  return ctx;
}
