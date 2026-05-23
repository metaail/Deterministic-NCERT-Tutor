import { z } from 'zod';

export const ExamEnum = z.enum(["NEET", "JEE_MAIN", "JEE_ADVANCED"]);
export const PyqStatusEnum = z.enum(["uploaded", "processing", "indexed", "reviewed", "published", "failed"]);
export const PyqQuestionStatusEnum = z.enum(["draft", "published"]);
export const VisualDependencyEnum = z.enum(["none", "helpful", "required"]);
export const DisplayPolicyEnum = z.literal("reference_only");

export const PyqPaperSchema = z.object({
  paperId: z.string(),
  exam: ExamEnum,
  year: z.number().int(),
  subject: z.string(),
  sourceFileName: z.string(),
  status: PyqStatusEnum,
  totalQuestions: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional()
});

export const VisualReferenceSchema = z.object({
  hasVisual: z.boolean(),
  visualDescription: z.string().optional(),
  pageNumber: z.number().int().optional(),
  displayPolicy: DisplayPolicyEnum.default("reference_only")
});

export const PyqQuestionSchema = z.object({
  questionId: z.string(),
  paperId: z.string(),
  exam: ExamEnum,
  year: z.number().int(),
  subject: z.string(),
  chapterKey: z.string().optional(),
  topicTags: z.array(z.string()).default([]),
  conceptTags: z.array(z.string()).default([]),
  matchKeywords: z.array(z.string()).default([]),
  questionNumber: z.string(),
  questionText: z.string(),
  options: z.array(z.string()).default([]),
  answer: z.string().optional(),
  solutionText: z.string().optional(),
  hasVisual: z.boolean().default(false),
  visualDependency: VisualDependencyEnum.default("none"),
  visualReference: VisualReferenceSchema,
  formulaRefs: z.array(z.string()).default([]),
  difficulty: z.string().optional(),
  status: PyqQuestionStatusEnum.default("draft"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type PyqPaper = z.infer<typeof PyqPaperSchema>;
export type PyqQuestion = z.infer<typeof PyqQuestionSchema>;
export type VisualReference = z.infer<typeof VisualReferenceSchema>;
