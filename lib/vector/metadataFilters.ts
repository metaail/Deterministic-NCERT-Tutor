import { SubjectCodeEnum, ClassLevelEnum } from '@/lib/validators/models';

export function getStudentSearchFilters(
  subjectCode: string,
  classLevel: string,
  chapterKey: string
) {
  // Required metadata filters for student search
  return {
    subjectCode: { $eq: subjectCode },
    classLevel: { $eq: classLevel },
    chapterKey: { $eq: chapterKey },
    status: { $eq: 'published' },
  };
}
