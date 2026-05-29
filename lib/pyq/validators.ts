import { z } from 'zod';
export const pyqRequestSchema = {};
export const ExamEnum = z.enum(['NEET', 'JEE']);
export type ExamEnum = z.infer<typeof ExamEnum>;
