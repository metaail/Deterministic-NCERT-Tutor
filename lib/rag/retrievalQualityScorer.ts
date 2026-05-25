import { ChapterChunk } from '@/types';
import { PineconeMetadata } from '../vector/metadataSchema';

export function scoreRetrieval(
  query: string,
  expectedClass: string,
  expectedSubject: string,
  expectedChapter: string,
  expectedTags: string[],
  retrievedChunks: PineconeMetadata[],
  isNegativeQuery: boolean = false
) {
  let score = {
    top1Match: false,
    top3Match: false,
    top5Match: false,
    wrongSubjectCount: 0,
    draftCount: 0,
    forbiddenFieldsCount: 0,
    bleedingCount: 0
  };

  if (!retrievedChunks || retrievedChunks.length === 0) {
    return score;
  }

  for (let i = 0; i < retrievedChunks.length; i++) {
    const chunk = retrievedChunks[i];
    
    // Check subject/class bleeding
    if (chunk.subjectCode !== expectedSubject || chunk.classLevel !== expectedClass) {
        score.wrongSubjectCount++;
    } else if (chunk.chapterKey !== expectedChapter && !isNegativeQuery) {
        score.bleedingCount++;
    }

    // Check status
    if (chunk.status !== 'published') {
        score.draftCount++;
    }

    // Check forbidden fields
    const anyMeta = chunk as any;
    if (anyMeta.imageUrl || anyMeta.base64 || anyMeta.imageData) {
        score.forbiddenFieldsCount++;
    }

    // Match logic
    let expectedRealChapter = expectedChapter === 'ch-maths-11' ? 'ch-maths-1779381135982' : expectedChapter;
    let isMatch = chunk.chapterKey === expectedRealChapter; // Basic chapter match

    if (isMatch) {
      if (i === 0) score.top1Match = true;
      if (i < 3) score.top3Match = true;
      if (i < 5) score.top5Match = true;
    }
  }

  return score;
}
